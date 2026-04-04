import { useState, useCallback } from 'react';
import { splitBillService } from '../services/splitBillService';
import type { ParsedReceipt, ParticipantAssignment, SplitResult, ReceiptItem } from '../services/splitBillService';

export type SplitBillStep = 'capture' | 'review' | 'assign' | 'result';

export function useSplitBill() {
    // UI State
    const [currentStep, setCurrentStep] = useState<SplitBillStep>('capture');
    const [isProcessingIndicator, setIsProcessingIndicator] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [receiptImageRaw, setReceiptImageRaw] = useState<File | null>(null);
    const [receiptImageEnhanced, setReceiptImageEnhanced] = useState<string | null>(null);

    const [receiptData, setReceiptData] = useState<ParsedReceipt>({
        items: [], subtotal: 0, tax: 0, serviceCharge: 0, discount: 0, grandTotal: 0, taxInclusive: false
    });

    const [participants, setParticipants] = useState<{ id: string, name: string }[]>([]);

    // Qty-aware assignments: items[itemId] -> { participantId: qtyAssigned }
    const [itemAssignments, setItemAssignments] = useState<Record<string, Record<string, number>>>({});

    // Step 1: Process Image (Gemini AI primary, Tesseract.js fallback)
    const processImage = async (file: File) => {
        setIsProcessingIndicator(true);
        setError(null);
        setReceiptImageRaw(file);

        try {
            // Try Gemini AI first (server-side, more accurate)
            setProcessingProgress(20);
            console.log('[SplitBill] Trying Gemini AI...');

            try {
                const parsed = await splitBillService.parseReceiptWithGemini(file);
                console.log('[SplitBill] Gemini AI success:', parsed);

                // Create a preview image for the review step
                const previewUrl = URL.createObjectURL(file);
                setReceiptImageEnhanced(previewUrl);

                setReceiptData(parsed);
                setProcessingProgress(100);
                setCurrentStep('review');
                return;
            } catch (geminiErr: any) {
                console.warn('[SplitBill] Gemini AI failed, falling back to Tesseract:', geminiErr.message);
            }

            // Fallback: Tesseract.js (client-side OCR)
            console.log('[SplitBill] Using Tesseract.js fallback...');
            setProcessingProgress(10);
            const enhancedDataUrl = await splitBillService.preprocessImage(file);
            setReceiptImageEnhanced(enhancedDataUrl);

            setProcessingProgress(20);
            const text = await splitBillService.runOCR(enhancedDataUrl, (p) => {
                setProcessingProgress(20 + Math.floor(p * 0.7));
            });

            setProcessingProgress(95);
            const parsed = splitBillService.parseReceiptText(text);
            setReceiptData(parsed);

            setProcessingProgress(100);
            setCurrentStep('review');
        } catch (err: any) {
            setError(err.message || 'Failed to process receipt.');
        } finally {
            setIsProcessingIndicator(false);
            setProcessingProgress(0);
        }
    };

    // Step 2 functions: Update receipt data manually
    const updateReceiptItem = (id: string, field: keyof ReceiptItem, value: any) => {
        setReceiptData(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    if (field === 'qty' || field === 'unitPrice') {
                        updated.total = updated.qty * updated.unitPrice;
                    }
                    return updated;
                }
                return item;
            });
            // Auto recalculate subtotal
            const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
            return {
                ...prev,
                items: newItems,
                subtotal,
                grandTotal: subtotal + prev.tax + prev.serviceCharge - prev.discount
            };
        });
    };

    const addReceiptItem = () => {
        setReceiptData(prev => ({
            ...prev,
            items: [...prev.items, {
                id: crypto.randomUUID(),
                name: 'New Item',
                qty: 1,
                unitPrice: 0,
                total: 0
            }]
        }));
    };

    const removeReceiptItem = (id: string) => {
        setReceiptData(prev => {
            const newItems = prev.items.filter(item => item.id !== id);
            const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
            return {
                ...prev,
                items: newItems,
                subtotal,
                grandTotal: subtotal + prev.tax + prev.serviceCharge - prev.discount
            };
        });
        // Clean up assignments for removed item
        setItemAssignments(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const updateReceiptTotals = (field: keyof ParsedReceipt, value: any) => {
        setReceiptData(prev => {
            const next = { ...prev, [field]: value };
            if (field !== 'grandTotal' && field !== 'items') {
                next.grandTotal = next.subtotal + next.tax + next.serviceCharge - next.discount;
            }
            return next as ParsedReceipt;
        });
    };

    // Step 3 functions: Participant Management
    const addParticipant = (name: string) => {
        if (!name.trim()) return;
        setParticipants(prev => [...prev, { id: crypto.randomUUID(), name: name.trim() }]);
    };

    const removeParticipant = (id: string) => {
        setParticipants(prev => prev.filter(p => p.id !== id));
        // Clean up qty assignments for removed participant
        setItemAssignments(prev => {
            const next: Record<string, Record<string, number>> = {};
            Object.entries(prev).forEach(([itemId, assignments]) => {
                const cleaned = { ...assignments };
                delete cleaned[id];
                // Only keep the entry if there are remaining assignments
                if (Object.keys(cleaned).length > 0) {
                    next[itemId] = cleaned;
                }
            });
            return next;
        });
    };

    // ── Qty-Aware Assignment Helpers ─────────────────────────────────────

    /** Get how many qty of this item are assigned to a specific participant */
    const getAssignedQty = useCallback((itemId: string, participantId: string): number => {
        return itemAssignments[itemId]?.[participantId] || 0;
    }, [itemAssignments]);

    /** Get total qty assigned across all participants for this item */
    const getTotalAssignedQty = useCallback((itemId: string): number => {
        const assignments = itemAssignments[itemId];
        if (!assignments) return 0;
        return Object.values(assignments).reduce((sum, qty) => sum + qty, 0);
    }, [itemAssignments]);

    /** Get remaining unassigned qty for this item */
    const getRemainingQty = useCallback((itemId: string): number => {
        const item = receiptData.items.find(i => i.id === itemId);
        if (!item) return 0;
        return Math.max(0, item.qty - getTotalAssignedQty(itemId));
    }, [receiptData.items, getTotalAssignedQty]);

    /** Get all participant IDs that have any qty assigned to this item */
    const getAssignedParticipantIds = useCallback((itemId: string): string[] => {
        const assignments = itemAssignments[itemId];
        if (!assignments) return [];
        return Object.entries(assignments)
            .filter(([, qty]) => qty > 0)
            .map(([pid]) => pid);
    }, [itemAssignments]);

    /** Set a specific qty for a participant on an item (with validation) */
    const updateItemQtyAssignment = useCallback((itemId: string, participantId: string, qty: number) => {
        // Security: Enforce integer, non-negative
        const safeQty = Math.max(0, Math.floor(qty));

        setItemAssignments(prev => {
            const item = receiptData.items.find(i => i.id === itemId);
            if (!item) return prev;

            const currentAssignments = prev[itemId] || {};
            // Security: Check total assigned won't exceed item qty
            const otherAssignedQty = Object.entries(currentAssignments)
                .filter(([pid]) => pid !== participantId)
                .reduce((sum, [, q]) => sum + q, 0);

            const clampedQty = Math.min(safeQty, item.qty - otherAssignedQty);
            const finalQty = Math.max(0, clampedQty);

            if (finalQty === 0) {
                // Remove participant from this item
                const { [participantId]: _, ...rest } = currentAssignments;
                if (Object.keys(rest).length === 0) {
                    const { [itemId]: __, ...restItems } = prev;
                    return restItems;
                }
                return { ...prev, [itemId]: rest };
            }

            return {
                ...prev,
                [itemId]: {
                    ...currentAssignments,
                    [participantId]: finalQty
                }
            };
        });
    }, [receiptData.items]);

    /** Increment qty for a participant on an item by 1 */
    const incrementItemAssignment = useCallback((itemId: string, participantId: string) => {
        const current = getAssignedQty(itemId, participantId);
        const remaining = getRemainingQty(itemId);
        if (remaining > 0) {
            updateItemQtyAssignment(itemId, participantId, current + 1);
        }
    }, [getAssignedQty, getRemainingQty, updateItemQtyAssignment]);

    /** Decrement qty for a participant on an item by 1 */
    const decrementItemAssignment = useCallback((itemId: string, participantId: string) => {
        const current = getAssignedQty(itemId, participantId);
        if (current > 0) {
            updateItemQtyAssignment(itemId, participantId, current - 1);
        }
    }, [getAssignedQty, updateItemQtyAssignment]);

    /**
     * Hybrid toggle:
     * - qty=1 items: simple on/off toggle (same as before)
     * - qty>1 items: adds 1 qty if not assigned, removes if already assigned
     */
    const toggleItemAssignment = useCallback((itemId: string, participantId: string) => {
        const item = receiptData.items.find(i => i.id === itemId);
        if (!item) return;

        const currentQty = getAssignedQty(itemId, participantId);

        if (item.qty === 1) {
            // Simple toggle for single-qty items
            updateItemQtyAssignment(itemId, participantId, currentQty > 0 ? 0 : 1);
        } else {
            // For multi-qty items: toggle adds 1 or removes entirely
            if (currentQty > 0) {
                updateItemQtyAssignment(itemId, participantId, 0);
            } else {
                // Add 1 qty if there's remaining capacity
                const remaining = getRemainingQty(itemId);
                if (remaining > 0) {
                    updateItemQtyAssignment(itemId, participantId, 1);
                }
            }
        }
    }, [receiptData.items, getAssignedQty, getRemainingQty, updateItemQtyAssignment]);

    // Step 4: Yield final calculated results
    const calculateResults = useCallback((): SplitResult => {
        // Map itemAssignments to ParticipantAssignment array with qty-based shares
        const formattedAssignments: ParticipantAssignment[] = participants.map(p => {
            const participantItems: { itemId: string; share: number; qtyAssigned: number; }[] = [];

            Object.entries(itemAssignments).forEach(([itemId, assignments]) => {
                const qtyAssigned = assignments[p.id] || 0;
                if (qtyAssigned > 0) {
                    const item = receiptData.items.find(i => i.id === itemId);
                    const totalQty = item?.qty || 1;
                    participantItems.push({
                        itemId,
                        share: totalQty > 0 ? qtyAssigned / totalQty : 0,
                        qtyAssigned
                    });
                }
            });

            return {
                participantId: p.id,
                participantName: p.name,
                items: participantItems
            };
        });

        return splitBillService.calculateSplit(receiptData, formattedAssignments);
    }, [receiptData, participants, itemAssignments]);

    const reset = () => {
        setCurrentStep('capture');
        setReceiptImageRaw(null);
        setReceiptImageEnhanced(null);
        setReceiptData({ items: [], subtotal: 0, tax: 0, serviceCharge: 0, discount: 0, grandTotal: 0, taxInclusive: false });
        setParticipants([]);
        setItemAssignments({});
        setError(null);
    };

    return {
        currentStep, setCurrentStep,
        isProcessingIndicator, processingProgress, error,
        receiptImageRaw, receiptImageEnhanced,
        receiptData, setReceiptData, updateReceiptItem, addReceiptItem, removeReceiptItem, updateReceiptTotals,
        processImage,
        participants, addParticipant, removeParticipant,
        itemAssignments, toggleItemAssignment,
        // New qty-aware functions
        getAssignedQty, getTotalAssignedQty, getRemainingQty, getAssignedParticipantIds,
        updateItemQtyAssignment, incrementItemAssignment, decrementItemAssignment,
        calculateResults,
        reset
    };
}
