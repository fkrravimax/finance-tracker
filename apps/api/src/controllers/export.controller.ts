
import { Request, Response } from 'express';
import { exportService } from '../services/export.service.js';

export const exportController = {
    exportData: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const wallet = req.query.wallet as string | undefined;
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            const workbook = await exportService.generateReport(userId, { wallet, startDate, endDate });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader("Content-Disposition", "attachment; filename=" + "FinTrack_Report.xlsx");

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Export failed:", error);
            res.status(500).json({
                error: 'Failed to generate export',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
