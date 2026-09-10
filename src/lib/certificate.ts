import { jsPDF } from "jspdf";

export type CertificateData = {
  certificate_no: string;
  course_title: string | null;
  student_name: string | null;
  issued_at: string;
};

function buildCertificate(c: CertificateData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background + borders (brand navy / red)
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(15, 34, 68);
  doc.setLineWidth(8);
  doc.rect(18, 18, W - 36, H - 36);
  doc.setDrawColor(214, 40, 57);
  doc.setLineWidth(2);
  doc.rect(32, 32, W - 64, H - 64);

  doc.setTextColor(15, 34, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("SS TECH SERVICES", W / 2, 92, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 100, 120);
  doc.text("Training Academy · Lucknow, Uttar Pradesh, India", W / 2, 112, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(214, 40, 57);
  doc.text("CERTIFICATE OF COMPLETION", W / 2, 168, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 70, 90);
  doc.text("This is to certify that", W / 2, 212, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 34, 68);
  doc.text(c.student_name || "Student", W / 2, 252, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 70, 90);
  doc.text("has successfully completed the course", W / 2, 288, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 34, 68);
  doc.text(c.course_title || "Course", W / 2, 324, { align: "center", maxWidth: W - 160 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 100, 120);
  doc.text(`Certificate No: ${c.certificate_no}`, 80, H - 80);
  doc.text(
    `Issued on: ${new Date(c.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`,
    80,
    H - 62,
  );

  doc.setDrawColor(15, 34, 68);
  doc.setLineWidth(1);
  doc.line(W - 250, H - 86, W - 80, H - 86);
  doc.text("Authorised Signatory", W - 165, H - 68, { align: "center" });

  return doc;
}

/** Generates and downloads a printable A4 landscape certificate PDF. */
export function downloadCertificatePdf(c: CertificateData) {
  buildCertificate(c).save(`SS-TECH-SERVICES-Certificate-${c.certificate_no}.pdf`);
}

/** Same template rendered as a blob URL so admins can preview before approval. */
export function certificatePreviewUrl(c: CertificateData) {
  return buildCertificate(c).output("bloburl").toString();
}

