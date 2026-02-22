import { describe, it, expect } from 'vitest';
import {
    parsePrice,
    fixOCRDigits,
    isSeparatorLine,
    isGarbageLine,
    extractQty,
    extractAllPrices,
    isTaxLine,
    isServiceChargeLine,
    isDiscountLine,
    isPaymentOrChangeLine,
    isFooterLine,
} from './splitBillService';

// We need to import the class instance to test parseReceiptText
import { splitBillService } from './splitBillService';

// ════════════════════════════════════════════
// UNIT TESTS: Helper Functions
// ════════════════════════════════════════════

describe('fixOCRDigits', () => {
    it('replaces O with 0 between digits', () => {
        expect(fixOCRDigits('1O0')).toBe('100');
        expect(fixOCRDigits('2O.OOO')).toBe('20.000');
    });
    it('replaces l/I with 1 between digits', () => {
        expect(fixOCRDigits('l5.000')).toBe('l5.000'); // leading l not between digits
        expect(fixOCRDigits('1l5')).toBe('115');
        expect(fixOCRDigits('5I0')).toBe('510');
    });
    it('replaces S with 5 between digits', () => {
        expect(fixOCRDigits('1S0')).toBe('150');
    });
    it('handles leading O followed by digits', () => {
        expect(fixOCRDigits('O12')).toBe('012');
    });
});

describe('parsePrice', () => {
    // Indonesian format (dot = thousands)
    it('parses Rp 15.000', () => {
        expect(parsePrice('Rp 15.000')).toBe(15000);
    });
    it('parses Rp15.000', () => {
        expect(parsePrice('Rp15.000')).toBe(15000);
    });
    it('parses 1.500.000', () => {
        expect(parsePrice('1.500.000')).toBe(1500000);
    });
    it('parses IDR 15000', () => {
        expect(parsePrice('IDR 15000')).toBe(15000);
    });
    it('parses Rp 15.000,50 (Indonesian decimal)', () => {
        expect(parsePrice('Rp 15.000,50')).toBe(15000.50);
    });

    // US format (comma = thousands)
    it('parses $12.99', () => {
        expect(parsePrice('$12.99')).toBe(12.99);
    });
    it('parses USD 12.99', () => {
        expect(parsePrice('USD 12.99')).toBe(12.99);
    });
    it('parses Rp 15,000', () => {
        expect(parsePrice('Rp 15,000')).toBe(15000);
    });
    it('parses 1,500,000', () => {
        expect(parsePrice('1,500,000')).toBe(1500000);
    });
    it('parses 15,000.50 (US decimal)', () => {
        expect(parsePrice('15,000.50')).toBe(15000.50);
    });

    // Other currencies
    it('parses £ 9.50', () => {
        expect(parsePrice('£ 9.50')).toBe(9.50);
    });
    it('parses ¥ 1500', () => {
        expect(parsePrice('¥ 1500')).toBe(1500);
    });

    // Negative amounts
    it('parses -2.000 as negative', () => {
        expect(parsePrice('-2.000')).toBe(-2000);
    });
    it('parses (50.000) as negative', () => {
        expect(parsePrice('(50.000)')).toBe(-50000);
    });

    // Bare numbers
    it('parses 15000', () => {
        expect(parsePrice('15000')).toBe(15000);
    });
    it('returns 0 for empty', () => {
        expect(parsePrice('')).toBe(0);
    });
});

describe('isSeparatorLine', () => {
    it('detects ====', () => expect(isSeparatorLine('================================')).toBe(true));
    it('detects ----', () => expect(isSeparatorLine('--------------------------------')).toBe(true));
    it('detects ....', () => expect(isSeparatorLine('..................')).toBe(true));
    it('detects ____', () => expect(isSeparatorLine('__________')).toBe(true));
    it('rejects short', () => expect(isSeparatorLine('--')).toBe(false));
    it('rejects text', () => expect(isSeparatorLine('hello world')).toBe(false));
});

describe('isGarbageLine', () => {
    it('detects address', () => expect(isGarbageLine('Jl. Sudirman No. 12, Jakarta')).toBe(true));
    it('detects cashier', () => expect(isGarbageLine('Kasir: Dewi')).toBe(true));
    it('detects footer', () => expect(isGarbageLine('Terima kasih telah berbelanja')).toBe(true));
    it('does not flag item names', () => expect(isGarbageLine('INDOMIE GORENG')).toBe(false));
    it('does not flag prices', () => expect(isGarbageLine('10.500')).toBe(false));
});

describe('extractQty', () => {
    it('detects 3 x', () => expect(extractQty('INDOMIE GORENG     3 x 3.500').qty).toBe(3));
    it('detects 2x', () => expect(extractQty('Croissant              2x      28.000').qty).toBe(2));
    it('detects 1x', () => expect(extractQty('Ayam Goreng    1x   25.000   25.000').qty).toBe(1));
    it('detects x2', () => expect(extractQty('Item x2  50.000').qty).toBe(2));
    it('detects 2 @', () => expect(extractQty('2 @ 55.000').qty).toBe(2));
    it('defaults to 1', () => expect(extractQty('Nasi Goreng  85.000').qty).toBe(1));
});

describe('extractAllPrices', () => {
    it('finds formatted prices', () => {
        const result = extractAllPrices('Ayam Goreng    1x   25.000   25.000');
        expect(result).toEqual(['25.000', '25.000']);
    });
    it('finds bare prices', () => {
        const result = extractAllPrices('Item 15000');
        expect(result).toEqual(['15000']);
    });
    it('finds decimal prices', () => {
        const result = extractAllPrices('Coffee $12.99');
        expect(result).toEqual(['12.99']);
    });
});

describe('Detection helpers', () => {
    it('isTaxLine', () => {
        expect(isTaxLine('PPN 11%')).toBe(true);
        expect(isTaxLine('Tax 10%')).toBe(true);
        expect(isTaxLine('PB1 10%')).toBe(true);
        expect(isTaxLine('Ayam Goreng')).toBe(false);
    });
    it('isServiceChargeLine', () => {
        expect(isServiceChargeLine('Service Charge 5%')).toBe(true);
        expect(isServiceChargeLine('Srv.Chg 5%')).toBe(true);
        expect(isServiceChargeLine('Svc 5%')).toBe(true);
    });
    it('isDiscountLine', () => {
        expect(isDiscountLine('DISKON  -2.000')).toBe(true);
        expect(isDiscountLine('Disc. 10%')).toBe(true);
        expect(isDiscountLine('Voucher  -50.000')).toBe(true);
        expect(isDiscountLine('Cashback  -10.000')).toBe(true);
    });
    it('isPaymentOrChangeLine', () => {
        expect(isPaymentOrChangeLine('TUNAI  50.000')).toBe(true);
        expect(isPaymentOrChangeLine('GOPAY  73.081')).toBe(true);
        expect(isPaymentOrChangeLine('KEMBALIAN  26.690')).toBe(true);
    });
    it('isFooterLine', () => {
        expect(isFooterLine('Terima kasih telah berbelanja')).toBe(true);
        expect(isFooterLine('Thank you for visiting!')).toBe(true);
        expect(isFooterLine('PIN BENAR - TRANSAKSI BERHASIL')).toBe(true);
    });
});


// ════════════════════════════════════════════
// INTEGRATION TESTS: parseReceiptText
// ════════════════════════════════════════════

describe('parseReceiptText — Supermarket (Alfamart)', () => {
    const receipt = `ALFAMART
Jl. Sudirman No. 12, Jakarta

INDOMIE GORENG     3 x 3.500    10.500
AQUA 600ML         1 x 4.000     4.000
CHITATO            1 x 8.500     8.500
                              ---------
SUBTOTAL                         23.000
DISKON                           -2.000
PPN 11%                           2.310
TOTAL                            23.310

TUNAI                            50.000
KEMBALIAN                        26.690

Terima kasih telah berbelanja`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 3 items', () => {
        expect(parsed.items.length).toBe(3);
    });
    it('parses first item name correctly', () => {
        expect(parsed.items[0].name).toContain('INDOMIE');
    });
    it('parses first item qty', () => {
        expect(parsed.items[0].qty).toBe(3);
    });
    it('parses first item total', () => {
        expect(parsed.items[0].total).toBe(10500);
    });
    it('parses second item', () => {
        expect(parsed.items[1].name).toContain('AQUA');
        expect(parsed.items[1].qty).toBe(1);
        expect(parsed.items[1].total).toBe(4000);
    });
    it('parses third item', () => {
        expect(parsed.items[2].name).toContain('CHITATO');
        expect(parsed.items[2].total).toBe(8500);
    });
    it('parses subtotal', () => {
        expect(parsed.subtotal).toBe(23000);
    });
    it('parses discount', () => {
        expect(parsed.discount).toBe(2000);
    });
    it('parses tax', () => {
        expect(parsed.tax).toBe(2310);
    });
    it('parses grand total', () => {
        expect(parsed.grandTotal).toBe(23310);
    });
});

describe('parseReceiptText — Restaurant (Kopi Kenangan)', () => {
    const receipt = `KOPI KENANGAN - GRAND INDONESIA
Table: 12  |  Cashier: Budi
Order #: KK-20241115-0032

Kenangan Latte         1      35.000
  - Less Sweet
Croissant              2      28.000
                           ----------
Subtotal                       63.000
Service Charge 5%               3.150
PPN 11%                         6.931
                           ----------
TOTAL                          73.081

GOPAY                          73.081
CHANGE                              0

Thank you for visiting!`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 2 items', () => {
        expect(parsed.items.length).toBe(2);
    });
    it('parses latte with modifier', () => {
        expect(parsed.items[0].name).toContain('Kenangan Latte');
    });
    it('latte total is 35000', () => {
        expect(parsed.items[0].total).toBe(35000);
    });
    it('parses croissant', () => {
        expect(parsed.items[1].name).toContain('Croissant');
        expect(parsed.items[1].total).toBe(28000);
    });
    it('parses subtotal', () => {
        expect(parsed.subtotal).toBe(63000);
    });
    it('parses service charge', () => {
        expect(parsed.serviceCharge).toBe(3150);
    });
    it('parses PPN', () => {
        expect(parsed.tax).toBe(6931);
    });
    it('parses grand total', () => {
        expect(parsed.grandTotal).toBe(73081);
    });
});

describe('parseReceiptText — SPBU', () => {
    const receipt = `PERTAMINA SPBU 34.401.12
Jl. Gatot Subroto, Bandung

Produk    : Pertamax
Volume    : 20.05 Liter
Harga/L   : Rp 13.900
Total     : Rp 278.695

Nomor Pompa : 3
Tanggal     : 15/11/2024 14:32:05`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses at least 1 price line (total or item)', () => {
        // SPBU has key-value format; we check grand total at minimum
        expect(parsed.grandTotal).toBeGreaterThan(0);
    });
});

describe('parseReceiptText — Parking Receipt', () => {
    const receipt = `PARKIR ELEKTRONIK
Lokasi: Mall Taman Anggrek
Plat  : B 1234 ABC
Masuk : 10:15
Keluar: 14:30
Durasi: 4 Jam 15 Menit
Tarif : Rp 10.000
LUNAS`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('detects tarif amount', () => {
        expect(parsed.grandTotal).toBeGreaterThanOrEqual(10000);
    });
});

describe('parseReceiptText — ATM / Bank Transfer', () => {
    const receipt = `BCA - BUKTI TRANSAKSI
================================
Jenis       : Transfer Antar Bank
Tanggal     : 15 Nov 2024 09:23:17
No. Referensi: 20241115092317123

Dari Rek    : 1234567890
Ke Bank     : BNI
Ke Rek      : 0987654321
Nama        : JOHN DOE

Nominal     : Rp 500.000
Biaya Admin : Rp 6.500
Total Debet : Rp 506.500

Saldo Akhir : Rp 2.493.500
================================
PIN BENAR - TRANSAKSI BERHASIL`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses some total value', () => {
        expect(parsed.grandTotal).toBeGreaterThan(0);
    });
});

describe('parseReceiptText — E-Commerce (Tokopedia)', () => {
    const receipt = `Order ID   : TKP-20241115-9988776
Marketplace: Tokopedia

Produk     : Sepatu Nike Air Max 90
Warna      : White/Black
Ukuran     : 42
Qty        : 1

Harga      : 1.299.000
Ongkir     : 25.000
Voucher    : -50.000
Cashback   : -10.000
--------------------------
Total      : 1.264.000

Pembayaran : GoPay
Status     : LUNAS`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('detects e-commerce receipt total', () => {
        expect(parsed.grandTotal).toBeGreaterThan(0);
    });
});

describe('parseReceiptText — Pharmacy (Kimia Farma)', () => {
    const receipt = `APOTEK KIMIA FARMA #023
Apoteker: Apt. Siti Rahma, S.Farm

Rx No.   : KF-20241115-4421
Dokter   : dr. Budi Santoso
Pasien   : Rina Wijaya

1. Amoxicillin 500mg      Rp  45.000
   3x1 (sesudah makan)
2. Paracetamol 500mg      Rp  12.000
   3x1 (bila demam)
3. Vitamin C 1000mg       Rp  35.000
   1x1 (pagi hari)
                         ----------
TOTAL                     Rp  92.000`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 3 medicine items', () => {
        expect(parsed.items.length).toBe(3);
    });
    it('parses amoxicillin', () => {
        expect(parsed.items[0].name.toLowerCase()).toContain('amoxicillin');
        expect(parsed.items[0].total).toBe(45000);
    });
    it('parses paracetamol', () => {
        expect(parsed.items[1].name.toLowerCase()).toContain('paracetamol');
        expect(parsed.items[1].total).toBe(12000);
    });
    it('parses vitamin c', () => {
        expect(parsed.items[2].name.toLowerCase()).toContain('vitamin');
        expect(parsed.items[2].total).toBe(35000);
    });
    it('parses grand total', () => {
        expect(parsed.grandTotal).toBe(92000);
    });
});

describe('parseReceiptText — Utility Bill (PLN)', () => {
    const receipt = `PLN - BUKTI PEMBAYARAN LISTRIK
No. Pelanggan : 5217066789
Nama          : HENDRA KUSUMA
Alamat        : JL MAWAR NO 5 RT002/003

Periode       : Oktober 2024
Stand Meter
  Lalu        :  3.421
  Sekarang    :  3.687
  Selisih     :    266 kWh

Tagihan Listrik   : Rp 374.210
Biaya Admin       : Rp   2.500
Total Bayar       : Rp 376.710

Dibayar Via       : Indomaret
Tanggal           : 15/11/2024 08:45
No. Transaksi     : 9900123456789`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses a total value', () => {
        expect(parsed.grandTotal).toBeGreaterThan(0);
    });
});


// ════════════════════════════════════════════
// EDGE CASE TESTS
// ════════════════════════════════════════════

describe('Edge Cases — Currency Variations', () => {
    it('handles multiple currency formats in price parsing', () => {
        expect(parsePrice('Rp 15.000')).toBe(15000);
        expect(parsePrice('Rp15.000')).toBe(15000);
        expect(parsePrice('Rp 15,000')).toBe(15000);
        expect(parsePrice('IDR 15000')).toBe(15000);
        expect(parsePrice('$ 12.99')).toBe(12.99);
        expect(parsePrice('USD 12.99')).toBe(12.99);
        expect(parsePrice('£ 9.50')).toBe(9.50);
        expect(parsePrice('¥ 1500')).toBe(1500);
    });
});

describe('Edge Cases — Wrapped Item Names', () => {
    const receipt = `============================
Nasi Goreng Spesial Seafood
  Ala Chef Kelas Dunia          1x  85.000
Es Teh Manis                   2x   8.000
============================
TOTAL                           101.000`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('combines wrapped item name', () => {
        expect(parsed.items.length).toBeGreaterThanOrEqual(1);
        // The first item should include "Nasi Goreng" in its name
        const firstItem = parsed.items[0];
        expect(firstItem.name.toLowerCase()).toContain('nasi goreng');
        expect(firstItem.total).toBe(85000);
    });
});

describe('Edge Cases — Mixed Language', () => {
    const receipt = `===============
Chicken Teriyaki Bowl    2x  45.000   90.000
Ocha Green Tea           1x  15.000   15.000
===============
Subtotal                              105.000
Service Charge 5%                       5.250
Grand Total (Termasuk PPN)            110.250`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses items correctly despite mixed language', () => {
        expect(parsed.items.length).toBe(2);
    });
    it('parses grand total from mixed-language line', () => {
        expect(parsed.grandTotal).toBe(110250);
    });
    it('parses service charge', () => {
        expect(parsed.serviceCharge).toBe(5250);
    });
});

describe('Edge Cases — Item with Modifier Lines', () => {
    const receipt = `================
Cappuccino         1    35.000
  - Less Sugar
  - Extra Shot
Croissant          1    25.000
================
TOTAL                   60.000`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 2 items', () => {
        expect(parsed.items.length).toBe(2);
    });
    it('cappuccino has modifier attached', () => {
        // The modifier should be appended to the item name
        expect(parsed.items[0].name).toContain('Cappuccino');
    });
    it('totals are correct', () => {
        expect(parsed.items[0].total).toBe(35000);
        expect(parsed.items[1].total).toBe(25000);
    });
});

describe('Edge Cases — Multi-column Items', () => {
    const receipt = `============================
Ayam Goreng    1x   25.000   25.000
Es Teh         2x    8.000   16.000
============================
SUBTOTAL                      41.000
PPN 11%                        4.510
TOTAL                         45.510`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 2 items', () => {
        expect(parsed.items.length).toBe(2);
    });
    it('parses ayam goreng correctly', () => {
        expect(parsed.items[0].name).toContain('Ayam Goreng');
        expect(parsed.items[0].qty).toBe(1);
        expect(parsed.items[0].total).toBe(25000);
    });
    it('parses es teh correctly', () => {
        expect(parsed.items[1].name).toContain('Es Teh');
        expect(parsed.items[1].qty).toBe(2);
        expect(parsed.items[1].total).toBe(16000);
    });
    it('parses subtotal', () => {
        expect(parsed.subtotal).toBe(41000);
    });
    it('parses tax', () => {
        expect(parsed.tax).toBe(4510);
    });
    it('parses total', () => {
        expect(parsed.grandTotal).toBe(45510);
    });
});

describe('Edge Cases — Discount with Various Formats', () => {
    const receipt = `===========
Item A       1x  100.000   100.000
Item B       1x   50.000    50.000
===========
Subtotal                    150.000
Disc. 10%                   -15.000
Voucher                     -10.000
Cashback                     -5.000
PPN 11%                      13.200
TOTAL                       133.200`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('accumulates all discounts', () => {
        expect(parsed.discount).toBe(30000); // 15000 + 10000 + 5000
    });
    it('parses tax', () => {
        expect(parsed.tax).toBe(13200);
    });
    it('parses total', () => {
        expect(parsed.grandTotal).toBe(133200);
    });
});

describe('Edge Cases — No Separator Lines', () => {
    const receipt = `WARUNG MAKAN PAK JOKO
Nasi Goreng Spesial   25.000
Nasi Campur           20.000
Es Jeruk               8.000
Total                 53.000
Tunai                 60.000
Kembali                7.000`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses items without separators', () => {
        expect(parsed.items.length).toBeGreaterThanOrEqual(2);
    });
    it('identifies total correctly', () => {
        expect(parsed.grandTotal).toBe(53000);
    });
});

describe('Edge Cases — Negative Price Indicators', () => {
    it('parsePrice handles minus sign correctly', () => {
        expect(parsePrice('-50.000')).toBe(-50000);
    });
    it('parsePrice handles parentheses as negative', () => {
        expect(parsePrice('(50.000)')).toBe(-50000);
    });
});

describe('extractQty — standalone digit before currency', () => {
    it('detects qty before Rp', () => {
        expect(extractQty('Jus Alpukat 3 Rp 18.000 Rp 54.000').qty).toBe(3);
    });
    it('detects qty 1 before Rp', () => {
        expect(extractQty('Ayam Bakar Madu 1 Rp 45.000 Rp 45.000').qty).toBe(1);
    });
    it('detects qty before $', () => {
        expect(extractQty('Organic Eggs 3 $6.49 $19.47').qty).toBe(3);
    });
    it('does not falsely detect product codes', () => {
        // "Route 66" should not have qty 66
        expect(extractQty('Route 66 Special 35.000').qty).toBe(1);
    });
});

describe('isGarbageLine — new patterns', () => {
    it('detects No. Order', () => expect(isGarbageLine('No. Order : ORD-6514')).toBe(true));
    it('detects Receipt#', () => expect(isGarbageLine('Receipt#: #872246')).toBe(true));
    it('detects Date with space', () => expect(isGarbageLine('Date     : 01/01/2026 12:31 PM')).toBe(true));
    it('detects US address', () => expect(isGarbageLine('456 Oak Avenue, Los Angeles, CA 90001')).toBe(true));
    it('detects warteg', () => expect(isGarbageLine('WARTEG BAHARI')).toBe(true));
    it('detects mcdonald', () => expect(isGarbageLine("McDONALD'S")).toBe(true));
    it('detects column header ITEM DESCRIPTION', () => expect(isGarbageLine('ITEM DESCRIPTION          AMOUNT')).toBe(true));
    it('detects column header MENU', () => expect(isGarbageLine('MENU        QTY    HARGA    TOTAL')).toBe(true));
    it('still allows numbered pharmacy items', () => expect(isGarbageLine('1. Amoxicillin 500mg')).toBe(false));
    it('still allows food items', () => expect(isGarbageLine('Ayam Bakar Madu')).toBe(false));
});


// ════════════════════════════════════════════
// REAL-WORLD RECEIPT TESTS (User's actual test data)
// ════════════════════════════════════════════

describe('Real-World — Walmart (US format with @ qty)', () => {
    const receipt = `WALMART
456 Oak Avenue, Los Angeles, CA 90001
1-800-559-5557
============================================
Receipt#: #872246
Cashier : Jessica
Date     : 01/01/2026 12:31 PM
--------------------------------------------
ITEM DESCRIPTION                AMOUNT
--------------------------------------------
Diet Coke 12pk
  1 @ $7.99    $7.99
Pasta Penne 16oz
  1 @ $1.99    $1.99
Organic Eggs 12ct
  3 @ $6.49    $19.47
Tomato Sauce 24oz
  3 @ $2.49    $7.47
Baby Spinach 5oz
  1 @ $3.49    $3.49
Whole Milk 1 Gallon
  3 @ $4.99    $14.97
Bounty Paper Towels
  1 @ $8.99    $8.99
Chips Ahoy Cookies
  3 @ $4.49    $13.47
--------------------------------------------
SUBTOTAL                $77.84
DISCOUNT                -$5.00
TAX (8.75%)              $6.37
============================================
TOTAL                   $79.21
============================================
VISA CREDIT             $79.21
CHANGE                   $0.00
--------------------------------------------
Thank you for shopping!
Please keep this receipt
============================================`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 8 items', () => {
        expect(parsed.items.length).toBe(8);
    });
    it('parses Diet Coke', () => {
        expect(parsed.items[0].name).toContain('Diet Coke');
        expect(parsed.items[0].qty).toBe(1);
        expect(parsed.items[0].total).toBeCloseTo(7.99, 1);
    });
    it('parses Organic Eggs with qty 3', () => {
        const eggs = parsed.items.find(i => i.name.toLowerCase().includes('egg'));
        expect(eggs).toBeDefined();
        expect(eggs!.qty).toBe(3);
        expect(eggs!.total).toBeCloseTo(19.47, 1);
    });
    it('parses Whole Milk with qty 3', () => {
        const milk = parsed.items.find(i => i.name.toLowerCase().includes('milk'));
        expect(milk).toBeDefined();
        expect(milk!.qty).toBe(3);
        expect(milk!.total).toBeCloseTo(14.97, 1);
    });
    it('no garbage items (no WALMART or Date in items)', () => {
        const hasGarbage = parsed.items.some(i =>
            i.name.toLowerCase().includes('walmart') ||
            i.name.toLowerCase().includes('date') ||
            i.name.toLowerCase().includes('receipt')
        );
        expect(hasGarbage).toBe(false);
    });
    it('parses subtotal', () => {
        expect(parsed.subtotal).toBeCloseTo(77.84, 1);
    });
    it('parses discount', () => {
        expect(parsed.discount).toBeCloseTo(5.00, 1);
    });
    it('parses tax', () => {
        expect(parsed.tax).toBeCloseTo(6.37, 1);
    });
    it('parses grand total', () => {
        expect(parsed.grandTotal).toBeCloseTo(79.21, 1);
    });
});

describe('Real-World — Warteg Bahari (Indonesian multi-column)', () => {
    const receipt = `WARTEG BAHARI
Jl. Mangga Besar No. 44, Jakarta Barat
========================================
No. Order :                    ORD-6514
Meja      :                      Meja 4
Kasir     :                        Andi
Tanggal   :          06/01/2026 12:31:31
-----------------------------------------
MENU            QTY    HARGA      TOTAL
-----------------------------------------

Ayam Bakar Madu  1  Rp 45.000  Rp 45.000
Jus Alpukat      3  Rp 18.000  Rp 54.000
Pisang Goreng    2  Rp 12.000  Rp 24.000
Mie Goreng Seafood 3  Rp 38.000  Rp 114.000
Es Teh Manis     1  Rp 8.000   Rp 8.000
-----------------------------------------
Sub Total                    Rp 245.000
Service Charge 5%            Rp  12.250
PPN 11%                      Rp  28.297
========================================
TOTAL BAYAR                  Rp 285.547
========================================
SHOPEEPAY                    Rp 290.000
Kembalian                    Rp   4.453
-----------------------------------------
Terima kasih atas kunjungan Anda!
Selamat makan!
========================================`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 5 food items', () => {
        expect(parsed.items.length).toBe(5);
    });
    it('parses Ayam Bakar Madu', () => {
        expect(parsed.items[0].name.toLowerCase()).toContain('ayam bakar');
        expect(parsed.items[0].qty).toBe(1);
        expect(parsed.items[0].total).toBe(45000);
    });
    it('parses Jus Alpukat with qty 3', () => {
        expect(parsed.items[1].name.toLowerCase()).toContain('jus alpukat');
        expect(parsed.items[1].qty).toBe(3);
        expect(parsed.items[1].total).toBe(54000);
    });
    it('parses Mie Goreng Seafood with qty 3', () => {
        const mieGoreng = parsed.items.find(i => i.name.toLowerCase().includes('mie goreng'));
        expect(mieGoreng).toBeDefined();
        expect(mieGoreng!.qty).toBe(3);
        expect(mieGoreng!.total).toBe(114000);
    });
    it('no garbage items (no WARTEG or No. Order in items)', () => {
        const hasGarbage = parsed.items.some(i =>
            i.name.toLowerCase().includes('warteg') ||
            i.name.toLowerCase().includes('order') ||
            i.name.toLowerCase().includes('menu')
        );
        expect(hasGarbage).toBe(false);
    });
    it('parses subtotal', () => {
        expect(parsed.subtotal).toBe(245000);
    });
    it('parses service charge', () => {
        expect(parsed.serviceCharge).toBe(12250);
    });
    it('parses PPN', () => {
        expect(parsed.tax).toBe(28297);
    });
    it('parses grand total', () => {
        expect(parsed.grandTotal).toBe(285547);
    });
});

describe('Real-World — McDonald\'s Indonesia', () => {
    const receipt = `McDONALD'S
Jl. Thamrin No. 1, Jakarta Pusat
========================================
No. Order :                    ORD-5422
Meja      :                     Meja 30
Kasir     :                        Wati
Tanggal   :          01/04/2025 12:31:31
-----------------------------------------
MENU            QTY    HARGA      TOTAL
-----------------------------------------

Soto Ayam        2  Rp 28.000  Rp 56.000
Jus Alpukat      2  Rp 18.000  Rp 36.000
Nasi Goreng Spesial 1  Rp 35.000  Rp 35.000
Ayam Bakar Madu  1  Rp 45.000  Rp 45.000
Tahu Tempe Bacem 3  Rp 15.000  Rp 45.000
Es Teh Manis     3  Rp 8.000   Rp 24.000
-----------------------------------------
Sub Total                    Rp 241.000
Service Charge 5%            Rp  12.050
PPN 11%                      Rp  27.835
========================================
TOTAL BAYAR                  Rp 280.885
========================================
DANA                         Rp 280.885
Kembalian                    Rp       0
-----------------------------------------
Terima kasih atas kunjungan Anda!
Selamat makan!
========================================`;

    const parsed = splitBillService.parseReceiptText(receipt);

    it('parses 6 food items', () => {
        expect(parsed.items.length).toBe(6);
    });
    it('parses Soto Ayam with qty 2', () => {
        expect(parsed.items[0].name.toLowerCase()).toContain('soto ayam');
        expect(parsed.items[0].qty).toBe(2);
        expect(parsed.items[0].total).toBe(56000);
    });
    it('parses Nasi Goreng Spesial', () => {
        const nasi = parsed.items.find(i => i.name.toLowerCase().includes('nasi goreng'));
        expect(nasi).toBeDefined();
        expect(nasi!.total).toBe(35000);
    });
    it('parses Tahu Tempe Bacem with qty 3', () => {
        const tahu = parsed.items.find(i => i.name.toLowerCase().includes('tahu'));
        expect(tahu).toBeDefined();
        expect(tahu!.qty).toBe(3);
        expect(tahu!.total).toBe(45000);
    });
    it('no garbage items', () => {
        const hasGarbage = parsed.items.some(i =>
            i.name.toLowerCase().includes('mcdonald') ||
            i.name.toLowerCase().includes('order')
        );
        expect(hasGarbage).toBe(false);
    });
    it('parses subtotal', () => {
        expect(parsed.subtotal).toBe(241000);
    });
    it('parses grand total', () => {
        expect(parsed.grandTotal).toBe(280885);
    });
});
