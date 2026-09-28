import os
import json
import logging
import urllib.request
from flask import current_app
from app.services.financial_advisor import analyze_finances, DISCLAIMER_TEXT

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def get_financial_insights(income_total, expenses_total, category_spending, budgets_data, goals_data, previous_spending=None):
        """
        Generates financial recommendations.
        First executes the deterministic rule engine.
        Then, if an AI_API_KEY is configured, enhances the insights using an LLM.
        """
        # Always run deterministic rule engine first
        base_insights = analyze_finances(
            income_total=income_total,
            expenses_total=expenses_total,
            category_spending=category_spending,
            budgets_data=budgets_data,
            goals_data=goals_data,
            previous_spending=previous_spending
        )

        api_key = current_app.config.get('AI_API_KEY') or os.environ.get('AI_API_KEY')
        if not api_key:
            base_insights['advisor_mode'] = 'rule_based'
            base_insights['ai_enhanced'] = False
            return base_insights

        # Optional LLM integration: enrich summary
        try:
            enhanced_summary = AIService._call_llm_enhancement(
                api_key=api_key,
                summary=base_insights['summary'],
                income=income_total,
                expenses=expenses_total,
                savings_rate=base_insights['savings_rate'],
                overspending=base_insights['overspending_categories'],
                categories=category_spending
            )
            if enhanced_summary:
                base_insights['summary'] = enhanced_summary
                base_insights['advisor_mode'] = 'llm_enhanced'
                base_insights['ai_enhanced'] = True
            else:
                base_insights['advisor_mode'] = 'rule_based_fallback'
                base_insights['ai_enhanced'] = False
        except Exception as e:
            logger.warning(f"AI API call failed; continuing with rule-based fallback: {e}")
            base_insights['advisor_mode'] = 'rule_based_fallback'
            base_insights['ai_enhanced'] = False

        return base_insights

    @staticmethod
    def _call_llm_enhancement(api_key, summary, income, expenses, savings_rate, overspending, categories):
        """
        Calls external LLM endpoint to generate a personalized advisory narrative.
        Safely times out and never crashes application.
        """
        provider = current_app.config.get('AI_PROVIDER', 'gemini').lower()
        
        prompt = (
            f"You are a friendly, encouraging personal finance advisor for an Indian user. "
            f"Data for this month: Income: ₹{income:,.2f}, Expenses: ₹{expenses:,.2f}, "
            f"Savings Rate: {savings_rate:.1f}%, Spending by category: {json.dumps(categories)}, "
            f"Over-budget items: {json.dumps(overspending)}. "
            f"Draft a concise, warm 2-to-3 sentence executive financial summary with 1 actionable tip. "
            f"Amounts in INR (₹). Keep it professional and empathetic."
        )

        if provider == 'gemini':
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                result = json.loads(response.read().decode('utf-8'))
                candidates = result.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    if parts and 'text' in parts[0]:
                        return parts[0]['text'].strip()
        return None
