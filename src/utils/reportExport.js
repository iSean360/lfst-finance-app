import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, Packer, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { formatCurrency, formatDate, MONTHS } from './helpers';

/**
 * Export board meeting report to Microsoft Word format
 * @param {object} reportData - Report data from generateBoardReportData
 * @param {string} meetingDate - Board meeting date
 */
export const exportToWord = async (reportData, meetingDate) => {
  const { monthName, fiscalYear, membership, financial, capex, majorOpex, revenue, cashFlow, plannedCapexList } = reportData;

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: `Monthly Board Meeting Report`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: `${monthName} ${fiscalYear}`,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Board Meeting Date: ${formatDate(meetingDate)}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // 1. Membership Updates
        new Paragraph({
          text: '1. Membership Updates',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Total Members: `, bold: true }),
            new TextRun({ text: `${membership.total}` })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `New Members: `, bold: true }),
            new TextRun({ text: `${membership.new}` })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Returning Members: `, bold: true }),
            new TextRun({ text: `${membership.returning}` })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: 'New Member Names:',
          bold: true,
          spacing: { after: 100 }
        }),
        ...(membership.newMemberNames.length > 0
          ? membership.newMemberNames.map(name =>
              new Paragraph({
                text: `  • ${name}`,
                spacing: { after: 50 }
              })
            )
          : [new Paragraph({ text: '  None', spacing: { after: 50 } })]
        ),

        // 2. Financial Summary
        new Paragraph({
          text: '2. Financial Summary',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Budgeted Net Income: `, bold: true }),
            new TextRun({ text: formatCurrency(financial.budgetedNetIncome) })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Actual Net Income: `, bold: true }),
            new TextRun({ text: formatCurrency(financial.actualNetIncome) })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Variance: `, bold: true }),
            new TextRun({ text: formatCurrency(financial.actualNetIncome - financial.budgetedNetIncome) })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Budgeted Cash Balance: `, bold: true }),
            new TextRun({ text: formatCurrency(financial.budgetedCashBalance) })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Actual Cash Balance: `, bold: true }),
            new TextRun({ text: formatCurrency(financial.actualCashBalance) })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Variance: `, bold: true }),
            new TextRun({ text: formatCurrency(financial.actualCashBalance - financial.budgetedCashBalance) })
          ],
          spacing: { after: 100 }
        }),

        // 3. CAPEX Activity
        new Paragraph({
          text: '3. Capital Expenditures (CAPEX)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: 'Completed This Month:',
          bold: true,
          spacing: { after: 100 }
        }),
        ...(capex.completed.length > 0
          ? capex.completed.map(p => new Paragraph({
              text: `  • ${p.name}: ${formatCurrency(p.actualAmount || p.amount)}`,
              spacing: { after: 50 }
            }))
          : [new Paragraph({ text: '  None', spacing: { after: 50 } })]
        ),
        new Paragraph({
          text: 'Upcoming (Rest of Fiscal Year):',
          bold: true,
          spacing: { before: 200, after: 100 }
        }),
        ...(capex.upcoming.length > 0
          ? capex.upcoming.map(p => new Paragraph({
              text: `  • ${p.name} (${MONTHS[p.month]}): ${formatCurrency(p.amount)}`,
              spacing: { after: 50 }
            }))
          : [new Paragraph({ text: '  None planned', spacing: { after: 50 } })]
        ),

        // 4. Major OPEX Activity
        new Paragraph({
          text: '4. Major Maintenance (OPEX)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: 'Completed This Month:',
          bold: true,
          spacing: { after: 100 }
        }),
        ...(majorOpex.completed.length > 0
          ? majorOpex.completed.map(m => new Paragraph({
              text: `  • ${m.name}: ${formatCurrency(m.lastOccurrence?.amount || m.budgetAmount)}`,
              spacing: { after: 50 }
            }))
          : [new Paragraph({ text: '  None', spacing: { after: 50 } })]
        ),
        new Paragraph({
          text: 'Upcoming (Rest of Fiscal Year):',
          bold: true,
          spacing: { before: 200, after: 100 }
        }),
        ...(majorOpex.upcoming.length > 0
          ? majorOpex.upcoming.map(m => new Paragraph({
              text: `  • ${m.name} (${MONTHS[m.month]}): ${formatCurrency(m.budgetAmount)}`,
              spacing: { after: 50 }
            }))
          : [new Paragraph({ text: '  None planned', spacing: { after: 50 } })]
        ),

        // 5. Revenue Analysis
        new Paragraph({
          text: '5. Revenue Analysis',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Budgeted Revenue: `, bold: true }),
            new TextRun({ text: formatCurrency(revenue.budgeted) })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Actual Revenue: `, bold: true }),
            new TextRun({ text: formatCurrency(revenue.actual) })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Variance: `, bold: true }),
            new TextRun({ text: formatCurrency(revenue.variance) })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          text: 'Revenue by Category:',
          bold: true,
          spacing: { after: 100 }
        }),
        ...(Object.keys(revenue.byCategory).length > 0
          ? Object.entries(revenue.byCategory).map(([category, amount]) =>
              new Paragraph({
                text: `  • ${category}: ${formatCurrency(amount)}`,
                spacing: { after: 50 }
              })
            )
          : [new Paragraph({ text: '  No revenue recorded', spacing: { after: 50 } })]
        ),

        // 6. Cash Flow Table
        new Paragraph({
          text: '6. Cash Flow: Budget vs Actual',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        createCashFlowTable(cashFlow),

        // 7. Planned CAPEX List
        new Paragraph({
          text: '7. All Planned CAPEX Expenditures',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        }),
        ...(plannedCapexList.length > 0
          ? plannedCapexList.map(p => new Paragraph({
              text: `  • ${p.name} (${MONTHS[p.month]} ${p.fiscalYear}): ${formatCurrency(p.amount)}${p.completed ? ' ✓ Completed' : ''}`,
              spacing: { after: 50 }
            }))
          : [new Paragraph({ text: '  No CAPEX projects planned', spacing: { after: 50 } })]
        )
      ]
    }]
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Board_Meeting_Report_${monthName}_${fiscalYear}.docx`);
};

/**
 * Helper function to create cash flow table for Word doc
 */
const createCashFlowTable = (projections) => {
  const rows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Month', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Revenue Budget', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Revenue Actual', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'OPEX Budget', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'OPEX Actual', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'CAPEX Budget', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'CAPEX Actual', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Net Budget', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
        new TableCell({
          children: [new Paragraph({ text: 'Net Actual', bold: true })],
          shading: { fill: "E0E0E0" }
        }),
      ]
    }),
    // Data rows
    ...projections.map(p => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(p.monthName || MONTHS[p.month] || '')] }),
        new TableCell({ children: [new Paragraph(formatCurrency(p.revenueBudget || 0))] }),
        new TableCell({ children: [new Paragraph(p.isActual ? formatCurrency(p.revenue || 0) : '-')] }),
        new TableCell({ children: [new Paragraph(formatCurrency((p.opexBudget || 0) + (p.gaBudget || 0)))] }),
        new TableCell({ children: [new Paragraph(p.isActual ? formatCurrency((p.opex || 0) + (p.ga || 0)) : '-')] }),
        new TableCell({ children: [new Paragraph(formatCurrency(p.capexBudget || 0))] }),
        new TableCell({ children: [new Paragraph(p.isActual && p.capex > 0 ? formatCurrency(p.capex) : '-')] }),
        new TableCell({ children: [new Paragraph(formatCurrency(p.budgetedNet || 0))] }),
        new TableCell({ children: [new Paragraph(p.isActual ? formatCurrency(p.actualNet || 0) : '-')] }),
      ]
    }))
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    }
  });
};
