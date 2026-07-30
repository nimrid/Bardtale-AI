import os
import logging
from pathlib import Path
from typing import Dict, Any, List
from config import PDF_STORAGE_DIR

logger = logging.getLogger(__name__)

def assemble_pdf(order_id: str, story: Dict[str, Any], image_paths: List[str], tier_name: str) -> str:
    """Assembles storybook PDF using ReportLab Platypus layout."""
    pdf_filename = f"story_{order_id}.pdf"
    pdf_path = PDF_STORAGE_DIR / pdf_filename

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()

        # Custom Paragraph Styles
        cover_title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=28,
            leading=34,
            textColor=colors.HexColor('#1E1B4B'),
            alignment=1,  # Center
            spaceAfter=15
        )

        cover_subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#4C1D95'),
            alignment=1,
            spaceAfter=25
        )

        page_number_style = ParagraphStyle(
            'PageHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=14,
            textColor=colors.HexColor('#6D28D9'),
            alignment=1,
            spaceAfter=15
        )

        story_text_style = ParagraphStyle(
            'StoryBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=14,
            leading=22,
            textColor=colors.HexColor('#1F2937'),
            alignment=0,  # Left aligned
            spaceBefore=10,
            spaceAfter=15
        )

        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=11,
            textColor=colors.HexColor('#9CA3AF'),
            alignment=1
        )

        story_elements = []

        # --- COVER PAGE ---
        story_elements.append(Spacer(1, 0.2 * inch))
        title = story.get("title", "My Illustrated Story")
        story_elements.append(Paragraph(title, cover_title_style))
        story_elements.append(Paragraph(f"Commissioned Edition • {tier_name.title()} Tier", cover_subtitle_style))
        story_elements.append(Spacer(1, 0.2 * inch))

        # Cover Illustration (First image in list)
        if image_paths and os.path.exists(image_paths[0]):
            try:
                cover_img = RLImage(image_paths[0], width=5.5 * inch, height=5.5 * inch)
                story_elements.append(cover_img)
            except Exception as e:
                logger.error(f"Error loading cover image {image_paths[0]}: {e}")

        story_elements.append(Spacer(1, 0.3 * inch))
        story_elements.append(Paragraph("Powered by Nimiq Pay • Claude AI • Stability AI", footer_style))
        story_elements.append(PageBreak())

        # --- STORY PAGES ---
        pages = story.get("pages", [])
        for idx, page_data in enumerate(pages):
            page_num = page_data.get("page_number", idx + 1)
            page_text = page_data.get("text", "")
            
            story_elements.append(Paragraph(f"— Page {page_num} —", page_number_style))
            story_elements.append(Spacer(1, 0.1 * inch))

            # Check if this page has a corresponding image
            if idx < len(image_paths) and os.path.exists(image_paths[idx]):
                try:
                    page_img = RLImage(image_paths[idx], width=4.8 * inch, height=4.8 * inch)
                    story_elements.append(page_img)
                    story_elements.append(Spacer(1, 0.2 * inch))
                except Exception as e:
                    logger.error(f"Error loading image for page {page_num}: {e}")

            # Story Paragraph
            story_elements.append(Paragraph(page_text, story_text_style))
            story_elements.append(Spacer(1, 0.2 * inch))

            # Page Footer
            story_elements.append(Paragraph(f"Illustrated Story Commission • Nimiq Pay", footer_style))

            if idx < len(pages) - 1:
                story_elements.append(PageBreak())

        doc.build(story_elements)
        logger.info(f"Successfully generated PDF at {pdf_path}")
        return str(pdf_path)

    except ImportError:
        logger.warning("ReportLab not installed. Using HTML/Text PDF builder fallback.")
        return _generate_fallback_text_pdf(pdf_path, story, tier_name)

def _generate_fallback_text_pdf(pdf_path: Path, story: Dict[str, Any], tier_name: str) -> str:
    """Fallback file creator when reportlab is not present."""
    title = story.get("title", "Illustrated Story")
    content = f"# {title}\n"
    content += f"Tier: {tier_name}\n\n"
    for page in story.get("pages", []):
        content += f"--- Page {page.get('page_number')} ---\n"
        content += f"{page.get('text')}\n\n"
        
    with open(pdf_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    return str(pdf_path)
