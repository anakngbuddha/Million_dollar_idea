import { Timestamp } from 'firebase/firestore';
import type { Assignment, AssignmentSubmission } from '../services/classroomService';

/**
 * Helper function to safely convert Firebase Timestamp to Date
 */
const convertToDate = (value: Date | Timestamp): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return value;
};

/**
 * Export assignment records to CSV format
 */
export const exportAssignmentToCSV = (
  assignment: Assignment,
  submissions: AssignmentSubmission[]
): string => {
  // CSV Header
  const headers = [
    'Student Name',
    'Student Email',
    'Submission Status',
    'Score',
    'Max Score',
    'Percentage',
    'Submitted Date',
    'Feedback',
  ];

  // CSV Rows
  const rows = submissions.map((submission) => {
    const percentage =
      submission.score !== undefined
        ? ((submission.score / submission.maxScore) * 100).toFixed(2)
        : 'N/A';
    const submittedDate = submission.submittedAt
      ? convertToDate(submission.submittedAt).toLocaleDateString()
      : 'Not submitted';

    return [
      `"${submission.studentName}"`,
      `"${submission.studentEmail}"`,
      submission.status,
      submission.score ?? 'Not graded',
      submission.maxScore,
      percentage,
      submittedDate,
      `"${submission.feedback || ''}"`,
    ];
  });

  // Combine and return
  const csvContent = [
    `Assignment: ${assignment.title}`,
    `Due Date: ${assignment.dueDate ? convertToDate(assignment.dueDate).toLocaleDateString() : 'N/A'}`,
    `Max Score: ${assignment.maxScore}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (content: string, fileName: string): void => {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/csv;charset=utf-8,' + encodeURIComponent(content)
  );
  element.setAttribute('download', `${fileName}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Download Excel file (requires xlsx library)
 * Install with: npm install xlsx
 */
export const downloadExcel = async (
  assignment: Assignment,
  submissions: AssignmentSubmission[],
  fileName: string
): Promise<void> => {
  try {
    const XLSX = await import('xlsx');

    // Prepare data
    const data = submissions.map((submission) => ({
      'Student Name': submission.studentName,
      'Student Email': submission.studentEmail,
      'Status': submission.status,
      'Score': submission.score ?? 'Not graded',
      'Max Score': submission.maxScore,
      'Percentage': submission.score
        ? `${((submission.score / submission.maxScore) * 100).toFixed(2)}%`
        : 'N/A',
      'Submitted Date': submission.submittedAt
        ? convertToDate(submission.submittedAt).toLocaleDateString()
        : 'Not submitted',
      'Feedback': submission.feedback || '',
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assignment Records');

    // Add summary sheet
    const summaryData = [
      { 'Field': 'Assignment Title', 'Value': assignment.title },
      { 'Field': 'Due Date', 'Value': assignment.dueDate ? convertToDate(assignment.dueDate).toLocaleDateString() : 'N/A' },
      { 'Field': 'Max Score', 'Value': assignment.maxScore },
      { 'Field': 'Total Submissions', 'Value': submissions.filter((s) => s.status !== 'pending').length },
      { 'Field': 'Graded Submissions', 'Value': submissions.filter((s) => s.status === 'graded').length },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Download
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    throw new Error('Failed to download Excel file. Make sure xlsx library is installed.');
  }
};

/**
 * Generate PDF report (requires jspdf and html2canvas)
 * Install with: npm install jspdf html2canvas
 */
export const downloadPDF = async (
  assignment: Assignment,
  submissions: AssignmentSubmission[],
  fileName: string
): Promise<void> => {
  try {
    const jsPDF = (await import('jspdf')).jsPDF;
    const html2canvas = (await import('html2canvas')).default;

    // Create a temporary container
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.padding = '20px';
    container.style.backgroundColor = 'white';
    container.style.color = 'black';

    // Add content
    const html = `
      <div>
        <h1 style="font-size: 24px; margin-bottom: 20px;">${assignment.title}</h1>
        
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
          <p><strong>Due Date:</strong> ${assignment.dueDate ? convertToDate(assignment.dueDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Max Score:</strong> ${assignment.maxScore}</p>
          <p><strong>Description:</strong> ${assignment.description}</p>
        </div>

        <h2 style="font-size: 18px; margin-bottom: 15px;">Submission Records</h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Student Name</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Email</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">Status</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">Score</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">Percentage</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Submitted Date</th>
            </tr>
          </thead>
          <tbody>
            ${submissions
              .map(
                (submission) => `
              <tr style="border-bottom: 1px solid #d1d5db;">
                <td style="padding: 8px; border: 1px solid #d1d5db;">${submission.studentName}</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${submission.studentEmail}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${submission.status}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${submission.score ?? 'Not graded'}/${submission.maxScore}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #d1d5db;">${
                  submission.score
                    ? ((submission.score / submission.maxScore) * 100).toFixed(2)
                    : 'N/A'
                }%</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${
                  submission.submittedAt
                    ? convertToDate(submission.submittedAt).toLocaleDateString()
                    : 'Not submitted'
                }</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    container.innerHTML = html;
    document.body.appendChild(container);

    // Convert to canvas
    const canvas = await html2canvas(container, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: 'white',
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= 280;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 280;
    }

    // Download
    pdf.save(`${fileName}.pdf`);

    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Make sure jspdf and html2canvas are installed.');
  }
};

/**
 * Check if required libraries are installed
 */
export const checkExportDependencies = async (): Promise<{
  xlsx: boolean;
  pdf: boolean;
}> => {
  return {
    xlsx: await checkPackageInstalled('xlsx'),
    pdf: await checkPackageInstalled('jspdf'),
  };
};

async function checkPackageInstalled(packageName: string): Promise<boolean> {
  try {
    await import(packageName);
    return true;
  } catch {
    return false;
  }
}