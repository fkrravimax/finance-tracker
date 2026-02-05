
# Fix Build Errors(Regression)

## Diagnosis
The `replace_file_content` tool in the previous step accidentally removed a large block of code in `SavingsVault.tsx` while trying to add the skeleton import.This removed state declarations(`setLoading`, `setGoals`, etc.) and helper variables, causing TypeScript build errors.Similarly, `Reports.tsx` had some variable declaration issues.

## Plan
1. ** Restconst SavingsVault: React.FC = () => {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [updateAmount, setUpdateAmount] = useState('');
    const [updateType, setUpdateType] = useState<'deposit' | 'withdraw'>('deposit');
    const { showNotification } = useNotification();
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        goalId: string | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        goalId: null,
        isLoading: false
    });

    // Toggle Menu
    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Create Goal State
    const [createFormData, setCreateFormData] = useState({
        name: '',
        targetAmount: '',
        targetDate: ''
    });

    // Fetch Goals on Mount
    useEffect(() => {
        fetchGoals();
    }, []); variables, hooks, and handler functions.
2. ** Fix`Reports.tsx` **: Ensure `timeOptions` and `formatPeriod` are properly declared inside the component or outside if static.

## Verification
        - Run`npm run build` or check Vercel deployment status.
