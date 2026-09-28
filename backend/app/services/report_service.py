import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class ReportService:
    @staticmethod
    def generate_pdf(user, month_name, year, report_data):
        """
        Generates a professional PDF monthly financial statement in memory.
        Returns bytes buffer.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#64748B')
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Italic'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#94A3B8'),
            alignment=TA_CENTER
        )

        story = []

        # Header
        story.append(Paragraph("Personal Finance Advisor Bot", title_style))
        story.append(Paragraph(f"Monthly Financial Statement — {month_name} {year}", subtitle_style))
        story.append(Paragraph(f"Member: <b>{user.name}</b> ({user.email}) | Generated on {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4F46E5'), spaceAfter=14))

        # 1. Executive Summary Table
        story.append(Paragraph("1. Executive Summary", h2_style))
        summary_rows = [
            ["Total Monthly Income", f"₹{report_data['total_income']:,.2f}"],
            ["Total Monthly Expenses", f"₹{report_data['total_expenses']:,.2f}"],
            ["Net Monthly Savings", f"₹{report_data['total_savings']:,.2f}"],
            ["Savings Rate", f"{report_data['savings_percentage']}%"],
            ["Highest Spending Category", f"{report_data.get('highest_spending_category', 'None')}"],
            ["Lowest Spending Category", f"{report_data.get('lowest_spending_category', 'None')}"]
        ]
        t_summary = Table(summary_rows, colWidths=[240, 260])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1E293B')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(t_summary)
        story.append(Spacer(1, 12))

        # 2. Category-wise Spending Breakdown
        story.append(Paragraph("2. Category-wise Expenses", h2_style))
        cat_rows = [["Category", "Amount Spent", "% of Total"]]
        for item in report_data.get('category_wise_expenses', []):
            cat_rows.append([
                item['category'],
                f"₹{item['amount']:,.2f}",
                f"{item['percentage']}%"
            ])
        if len(cat_rows) == 1:
            cat_rows.append(["No expenses recorded", "₹0.00", "0%"])

        t_cat = Table(cat_rows, colWidths=[200, 150, 150])
        t_cat.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_cat)
        story.append(Spacer(1, 12))

        # 3. Budget Performance
        story.append(Paragraph("3. Budget Performance", h2_style))
        budget_rows = [["Category", "Budget", "Actual Spent", "Remaining", "Status"]]
        for b in report_data.get('budget_vs_actual', []):
            budget_rows.append([
                b['category'],
                f"₹{b['budget']:,.2f}",
                f"₹{b['spent']:,.2f}",
                f"₹{b['remaining']:,.2f}",
                b['status']
            ])
        if len(budget_rows) == 1:
            budget_rows.append(["No budgets configured for this month", "-", "-", "-", "-"])

        t_budget = Table(budget_rows, colWidths=[130, 90, 90, 90, 100])
        t_budget.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_budget)
        story.append(Spacer(1, 12))

        # 4. AI Advisor Executive Summary
        story.append(Paragraph("4. AI Financial Insights & Observations", h2_style))
        ai_text = report_data.get('ai_summary', 'No summary generated.')
        story.append(Paragraph(ai_text, body_style))
        story.append(Spacer(1, 16))

        # Disclaimer Footer
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
        story.append(Paragraph(
            "<b>Disclaimer:</b> These insights are for educational and budgeting purposes only and are not professional financial advice.",
            disclaimer_style
        ))

        doc.build(story)
        buffer.seek(0)
        return buffer
