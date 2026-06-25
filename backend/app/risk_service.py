"""
RiskAnalysisService — Fraud-detection-inspired risk scoring engine.

The engine evaluates four behavioral signals per transaction:
  1. HIGH_FREQUENCY  — more than N transactions within a 60-second window
  2. DUPLICATE_ATTEMPT — repeated submission of already-used idempotency keys
  3. MICRO_TRANSACTION — transactions below the minimum-amount threshold
  4. REPEATED_AMOUNT   — submitting the exact same dollar amount consecutively

Risk scores are clamped to [0, 100] and decay over time when the user
behaves normally, rewarding good behavior with a gradual score reduction.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta

from app.models import User, Transaction, RiskEvent
from app.config import settings
from app.audit_service import AuditService


# ---------------------------------------------------------------------------
# Risk thresholds (configurable via settings)
# ---------------------------------------------------------------------------
FREQUENCY_WINDOW_SECONDS = 60          # sliding window for frequency check
FREQUENCY_THRESHOLD      = 10         # max transactions in that window
MICRO_AMOUNT_THRESHOLD   = settings.MIN_AMOUNT_FOR_POINTS  # same as ranking
REPEATED_AMOUNT_LOOKBACK = 5          # how many recent txns to check for same amount

# Points added per signal detection
RISK_POINTS = {
    "high_frequency":    15,
    "duplicate_attempt": 20,
    "micro_transaction": 10,
    "repeated_amount":   12,
}

# Risk decay: points removed per hour of clean behavior
DECAY_RATE_PER_HOUR = 5.0


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class RiskAnalysisService:
    """Stateless service — every method receives the db session explicitly."""

    @staticmethod
    async def evaluate_transaction(
        db: AsyncSession,
        user: User,
        amount: float,
        is_duplicate: bool = False,
    ) -> None:
        """
        Run all risk checks against the current transaction context and
        update the user's risk_score accordingly.  Called from process_transaction.
        """
        # Apply time-based decay FIRST so that a long-idle user starts
        # from a lower baseline before new signals are evaluated.
        await RiskAnalysisService._apply_decay(user)

        # --- Signal 1: Duplicate attempt -----------------------------------
        if is_duplicate:
            user.duplicate_attempts += 1
            if user.duplicate_attempts >= 2:
                await RiskAnalysisService._record_event(
                    db, user, "duplicate_attempt",
                    RISK_POINTS["duplicate_attempt"],
                    f"Repeated duplicate request (attempt #{user.duplicate_attempts})",
                )

        # --- Signal 2: High frequency --------------------------------------
        window_start = datetime.now(timezone.utc) - timedelta(seconds=FREQUENCY_WINDOW_SECONDS)
        freq_result = await db.execute(
            select(func.count(Transaction.id)).where(
                and_(
                    Transaction.user_id == user.id,
                    Transaction.timestamp >= window_start,
                )
            )
        )
        recent_count = freq_result.scalar() or 0
        if recent_count > FREQUENCY_THRESHOLD:
            await RiskAnalysisService._record_event(
                db, user, "high_frequency",
                RISK_POINTS["high_frequency"],
                f"{recent_count} transactions in the last 60 seconds (limit: {FREQUENCY_THRESHOLD})",
            )

        # --- Signal 3: Micro-transaction -----------------------------------
        if amount < MICRO_AMOUNT_THRESHOLD:
            await RiskAnalysisService._record_event(
                db, user, "micro_transaction",
                RISK_POINTS["micro_transaction"],
                f"Small transaction of ${amount:.2f} (threshold: ${MICRO_AMOUNT_THRESHOLD:.2f})",
            )

        # --- Signal 4: Repeated same amount --------------------------------
        recent_txns = await db.execute(
            select(Transaction.amount)
            .where(Transaction.user_id == user.id)
            .order_by(Transaction.timestamp.desc())
            .limit(REPEATED_AMOUNT_LOOKBACK)
        )
        recent_amounts = [row[0] for row in recent_txns.fetchall()]
        if len(recent_amounts) >= 3 and len(set(recent_amounts)) == 1:
            await RiskAnalysisService._record_event(
                db, user, "repeated_amount",
                RISK_POINTS["repeated_amount"],
                f"Last {len(recent_amounts)} transactions all have amount ${recent_amounts[0]:.2f}",
            )

        # Clamp to [0, 100]
        user.risk_score = max(0.0, min(100.0, user.risk_score))

    @staticmethod
    async def get_analysis(db: AsyncSession, user_id: str) -> dict:
        """
        Build the full risk analysis report for the GET /risk-analysis endpoint.
        Applies time-decay before returning so the score is always fresh.
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if not user:
            return None

        # Apply decay so the returned score reflects elapsed clean time
        await RiskAnalysisService._apply_decay(user)
        user.risk_score = max(0.0, min(100.0, user.risk_score))
        await db.commit()

        # Determine risk level
        risk_level = RiskAnalysisService._classify(user.risk_score)

        # Gather unique recent reasons from the last 24 hours
        since = datetime.now(timezone.utc) - timedelta(hours=24)
        events_result = await db.execute(
            select(RiskEvent)
            .where(and_(RiskEvent.user_id == user_id, RiskEvent.timestamp >= since))
            .order_by(RiskEvent.timestamp.desc())
        )
        events = events_result.scalars().all()

        # De-duplicate by event_type, keeping only the most recent description
        seen_types = set()
        reasons = []
        for ev in events:
            if ev.event_type not in seen_types:
                seen_types.add(ev.event_type)
                reasons.append(ev.description)

        # Calculate confidence
        tx_count_result = await db.execute(select(func.count(Transaction.id)).where(Transaction.user_id == user_id))
        tx_count = tx_count_result.scalar() or 0
        confidence = min(100.0, max(0.0, tx_count * 10.0))

        # Determine recommendation
        if risk_level == "Low":
            recommendation = "No action needed. Behavior is normal."
        elif risk_level == "Medium":
            recommendation = "Monitor activity. User exhibits some suspicious patterns."
        else:
            recommendation = "Restrict account. High probability of abusive behavior."

        return {
            "user_id": user_id,
            "risk_score": round(user.risk_score, 2),
            "risk_level": risk_level,
            "confidence": round(confidence, 2),
            "recommendation": recommendation,
            "reasons": reasons,
        }

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------

    @staticmethod
    def _classify(score: float) -> str:
        """Map numeric score to human-readable level."""
        if score < 30:
            return "Low"
        elif score < 60:
            return "Medium"
        return "High"

    @staticmethod
    async def _apply_decay(user: User) -> None:
        """
        Reduce risk_score proportionally to how much clean time has elapsed
        since the last risk event or last decay application.
        """
        now = datetime.now(timezone.utc)
        if user.last_risk_decay is None:
            user.last_risk_decay = now
            return

        elapsed = (now - user.last_risk_decay).total_seconds()
        hours_elapsed = elapsed / 3600.0
        if hours_elapsed > 0 and user.risk_score > 0:
            decay = hours_elapsed * DECAY_RATE_PER_HOUR
            user.risk_score = max(0.0, user.risk_score - decay)
            user.last_risk_decay = now

    @staticmethod
    async def _record_event(
        db: AsyncSession,
        user: User,
        event_type: str,
        points: float,
        description: str,
    ) -> None:
        """Persist a risk event and bump the user's score."""
        event = RiskEvent(
            user_id=user.id,
            event_type=event_type,
            points_added=points,
            description=description,
        )
        db.add(event)
        user.risk_score += points
        # Reset decay clock because we just detected bad behavior
        user.last_risk_decay = datetime.now(timezone.utc)

        await AuditService.log_action(
            db, 
            user.id, 
            "Risk Score Updated", 
            f"Risk score increased by {points} due to: {event_type}"
        )
