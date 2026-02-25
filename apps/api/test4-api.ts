import { transactionController } from './src/controllers/transaction.controller.js';

async function test() {
    const req = {
        user: { id: "O0LJvtV4u9psNRKO11xcumruzfRDrA7Z" },
        query: {
            startDate: "2026-01-31T00:00:00.000Z",
            endDate: "2026-02-26T16:59:59.999Z"
        }
    };
    const res = {
        json: (data: any) => console.log("Response data length:", data?.length),
        status: (code: number) => {
            console.log("Status:", code);
            return res;
        }
    };

    await transactionController.getAll(req as any, res as any);
}
test().catch(console.error);
