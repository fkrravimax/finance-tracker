import { transactionController } from './src/controllers/transaction.controller.js';

async function test() {
    console.log("Testing Jan 31 to Feb 26...");
    let req: any = {
        user: { id: "O0LJvtV4u9psNRKO11xcumruzfRDrA7Z" },
        query: {
            startDate: "2026-01-30T17:00:00.000Z", // Local JS Date string for Jan 31
            endDate: "2026-02-26T16:59:59.999Z" // Local JS Date string for Feb 26 EoD
        }
    };
    let res: any = {
        json: (data: any) => console.log("WIDE RANGE RESULT LENGTH:", data?.length),
        status: (code: number) => {
            console.log("Status:", code);
            return res;
        }
    };
    await transactionController.getAll(req, res);

    console.log("Testing Feb 06 to Feb 26...");
    req = {
        user: { id: "O0LJvtV4u9psNRKO11xcumruzfRDrA7Z" },
        query: {
            startDate: "2026-02-05T17:00:00.000Z",
            endDate: "2026-02-26T16:59:59.999Z"
        }
    };
    res = {
        json: (data: any) => console.log("NARROW RANGE RESULT LENGTH:", data?.length),
        status: (code: number) => {
            console.log("Status:", code);
            return res;
        }
    };
    await transactionController.getAll(req, res);
}
test().catch(console.error);
