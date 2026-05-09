"""
Export module: generates CSV and PDF reports for all main entities.
"""
import csv
import io
from datetime import datetime, timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table as RLTable, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TableCell', fontSize=8, leading=10))
styles.add(ParagraphStyle(name='TableHeader', fontSize=9, leading=11, textColor=colors.white))
styles.add(ParagraphStyle(name='ReportTitle', fontSize=16, leading=20, alignment=TA_LEFT, spaceAfter=6))
styles.add(ParagraphStyle(name='ReportSubtitle', fontSize=10, leading=12, alignment=TA_LEFT, textColor=colors.grey, spaceAfter=14))

TEAL = colors.HexColor('#0F766E')
TEAL_LIGHT = colors.HexColor('#E0F7F5')
BORDER = colors.HexColor('#E2E8F0')

STATUS_LABELS = {
    'PENDING': 'Pendiente',
    'PAID': 'Pagada',
    'OVERDUE': 'Vencida',
    'CANCELLED': 'Cancelada',
}


def _make_table_style():
    """Standard table style for all PDF exports."""
    return TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TEAL_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ])


def _build_pdf(title, subtitle, headers, rows, page_orientation='portrait'):
    """Build a PDF buffer with title, subtitle and a table."""
    buf = io.BytesIO()
    pagesize = A4 if page_orientation == 'portrait' else landscape(A4)
    doc = SimpleDocTemplate(buf, pagesize=pagesize,
                            leftMargin=15*mm, rightMargin=15*mm,
                            topMargin=15*mm, bottomMargin=15*mm)
    elements = []

    elements.append(Paragraph(title, styles['ReportTitle']))
    elements.append(Paragraph(subtitle, styles['ReportSubtitle']))

    # Build table data
    table_data = [headers]
    for row in rows:
        table_data.append([str(cell) if cell is not None else '-' for cell in row])

    if len(table_data) == 1:
        elements.append(Paragraph("No hay datos para mostrar.", styles['Normal']))
    else:
        # Calculate column widths proportionally
        avail_width = pagesize[0] - 30*mm
        n_cols = len(headers)
        col_width = avail_width / n_cols

        t = RLTable(table_data, colWidths=[col_width]*n_cols, repeatRows=1)
        t.setStyle(_make_table_style())
        elements.append(t)

    # Footer
    elements.append(Spacer(1, 10*mm))
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    elements.append(Paragraph(f"Generado: {now}", styles['ReportSubtitle']))

    doc.build(elements)
    buf.seek(0)
    return buf


def _build_csv(headers, rows):
    """Build a CSV string buffer."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([str(cell) if cell is not None else '' for cell in row])
    buf.seek(0)
    return buf


# ────────────────────────────────────────
# STUDENTS EXPORT
# ────────────────────────────────────────
def export_students_csv(students):
    headers = ['Nombre', 'Email', 'Teléfono', 'Fecha Nacimiento', 'Estado']
    rows = [[s.get('name'), s.get('email'), s.get('phone'), s.get('birth_date'),
             'Activo' if s.get('active') else 'Inactivo'] for s in students]
    return _build_csv(headers, rows)


def export_students_pdf(students):
    headers = ['Nombre', 'Email', 'Teléfono', 'Nacimiento', 'Estado']
    rows = [[s.get('name'), s.get('email'), s.get('phone'), s.get('birth_date'),
             'Activo' if s.get('active') else 'Inactivo'] for s in students]
    return _build_pdf(
        'Reporte de Alumnos',
        f'Total: {len(students)} alumnos',
        headers, rows,
    )


# ────────────────────────────────────────
# CLASSES EXPORT
# ────────────────────────────────────────
def export_classes_csv(classes):
    headers = ['Nombre', 'Tipo', 'Profesor', 'Máx. Alumnos', 'Inscriptos', 'Inicio', 'Fin', 'Estado']
    rows = [[c.get('name'), c.get('class_type_name'), c.get('teacher_name'),
             c.get('max_students'), c.get('enrolled_count', 0),
             c.get('start_date'), c.get('end_date'),
             'Activa' if c.get('active') else 'Inactiva'] for c in classes]
    return _build_csv(headers, rows)


def export_classes_pdf(classes):
    headers = ['Nombre', 'Tipo', 'Profesor', 'Máx.', 'Inscrip.', 'Inicio', 'Fin']
    rows = [[c.get('name'), c.get('class_type_name'), c.get('teacher_name'),
             c.get('max_students'), c.get('enrolled_count', 0),
             c.get('start_date'), c.get('end_date')] for c in classes]
    return _build_pdf(
        'Reporte de Clases',
        f'Total: {len(classes)} clases activas',
        headers, rows, 'landscape',
    )


# ────────────────────────────────────────
# BILLING EXPORT
# ────────────────────────────────────────
def export_billing_csv(bills):
    headers = ['Alumno', 'Periodo', 'Concepto', 'Monto', 'Vencimiento', 'Fecha Pago', 'Estado']
    rows = [[b.get('student_name'), b.get('billing_period'), b.get('description'), b.get('amount'),
             b.get('due_date'), b.get('paid_date'),
             STATUS_LABELS.get(b.get('status'), b.get('status'))] for b in bills]
    return _build_csv(headers, rows)


def export_billing_pdf(bills):
    headers = ['Alumno', 'Periodo', 'Concepto', 'Monto', 'Vencimiento', 'Pago', 'Estado']
    rows = [[b.get('student_name'), b.get('billing_period'), b.get('description'),
             f"${b.get('amount', 0):.2f}", b.get('due_date'), b.get('paid_date'),
             STATUS_LABELS.get(b.get('status'), b.get('status'))] for b in bills]
    total = sum(b.get('amount', 0) for b in bills)
    return _build_pdf(
        'Reporte de Facturación',
        f'Total: {len(bills)} facturas • Monto total: ${total:.2f}',
        headers, rows, 'landscape',
    )


# ────────────────────────────────────────
# ATTENDANCE EXPORT
# ────────────────────────────────────────
def export_attendance_csv(records, schedule_info=None):
    headers = ['Alumno', 'Estado', 'Notas']
    rows = [[r.get('student_name'), 'Presente' if r.get('present') else 'Ausente',
             r.get('notes', '')] for r in records]
    return _build_csv(headers, rows)


def export_attendance_pdf(records, schedule_info=None):
    headers = ['Alumno', 'Estado', 'Notas']
    rows = [[r.get('student_name'), 'Presente' if r.get('present') else 'Ausente',
             r.get('notes', '')] for r in records]
    subtitle_parts = []
    if schedule_info:
        subtitle_parts.append(f"Clase: {schedule_info.get('class_name', '-')}")
        subtitle_parts.append(f"Fecha: {schedule_info.get('date', '-')}")
        subtitle_parts.append(f"Horario: {schedule_info.get('start_time', '')}-{schedule_info.get('end_time', '')}")
        subtitle_parts.append(f"Salón: {schedule_info.get('classroom_name', '-')}")
    present = sum(1 for r in records if r.get('present'))
    subtitle_parts.append(f"Presentes: {present}/{len(records)}")
    return _build_pdf(
        'Reporte de Asistencia',
        ' • '.join(subtitle_parts),
        headers, rows,
    )


# ────────────────────────────────────────
# TEACHERS EXPORT
# ────────────────────────────────────────
def export_teachers_csv(teachers):
    headers = ['Nombre', 'Email', 'Teléfono', 'Estado']
    rows = [[t.get('name'), t.get('email'), t.get('phone'),
             'Activo' if t.get('active') else 'Inactivo'] for t in teachers]
    return _build_csv(headers, rows)


def export_teachers_pdf(teachers):
    headers = ['Nombre', 'Email', 'Teléfono', 'Estado']
    rows = [[t.get('name'), t.get('email'), t.get('phone'),
             'Activo' if t.get('active') else 'Inactivo'] for t in teachers]
    return _build_pdf(
        'Reporte de Profesores',
        f'Total: {len(teachers)} profesores',
        headers, rows,
    )
