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

    // items[itemId] -> array of participantIds
    const [itemAssignments, setItemAssignments] = useState<Record<string, string[]>>({});

    // Step 1: Process Image
    const processImage = async (file: File) => {
        setIsProcessingIndicator(true);
        setError(null);
        setReceiptImageRaw(file);

        try {
            // 1. Preprocess
            setProcessingProgress(10);
            const enhancedDataUrl = await splitBillService.preprocessImage(file);
            setReceiptImageEnhanced(enhancedDataUrl);

            // 2. OCR
            setProcessingProgress(20);
            const text = await splitBillService.runOCR(enhancedDataUrl, (p) => {
                setProcessingProgress(20 + Math.floor(p * 0.7)); // Scale 0-100 to 20-90
            });

            // 3. Parse
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
        // Clean up assignments
        setItemAssignments(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(itemId => {
                next[itemId] = next[itemId].filter(pId => pId !== id);
            });
            return next;
        });
    };

    const toggleItemAssignment = (itemId: string, participantId: string) => {
        setItemAssignments(prev => {
            const currentAssignments = prev[itemId] || [];
            if (currentAssignments.includes(participantId)) {
                return { ...prev, [itemId]: currentAssignments.filter(id => id !== participantId) };
            } else {
                return { ...prev, [itemId]: [...currentAssignments, participantId] };
            }
        });
    };

    // Step 4: Yield final calculated results
    const calculateResults = useCallback((): SplitResult => {
        // Map itemAssignments back to ParticipantAssignment array for the service
        const formattedAssignments: ParticipantAssignment[] = participants.map(p => {
            const participantItems: { itemId: string; share: number; }[] = [];

            Object.entries(itemAssignments).forEach(([itemId, assignedUserIds]) => {
                if (assignedUserIds.includes(p.id)) {
                    // Split equally among everyone assigned to this item
                    participantItems.push({
                        itemId,
                        share: 1 / assignedUserIds.length
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
        calculateResults,
        reset
    };
}
