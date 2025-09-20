import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Navigation from '@/components/ui/navigation';
import { useToast } from '@/hooks/use-toast';
import { useClerkUser } from '@/hooks/useClerkUser';
import { expenseApi, analyticsApi } from '@/lib/api';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


interface ExpenseFormData {
  amount: string;
  title: string;
  notes: string;
  category: string;
  date: Date;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
];

const AddExpense = () => {
  const { backendUser, isLoading } = useClerkUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    title: '',
    notes: '',
    category: '',
    date: new Date(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');


  const handleInputChange = (field: keyof ExpenseFormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backendUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add expenses.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !formData.title || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in amount, title, and category.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const category = formData.category === 'custom' ? customCategory : formData.category;
      
      // Use backendUser.id instead of localStorage
      await expenseApi.create(backendUser.id, {
        amount,
        title: formData.title,
        notes: formData.notes || '',
        category,
        date: format(formData.date, 'yyyy-MM-dd'),
      });

      // Get updated analytics
      const analytics = await analyticsApi.getAnalytics(backendUser.id);

      // Show success toast with AI insight
      toast({
        title: "Expense Added Successfully",
        description: (
          <div className="space-y-2">
            <p>Added ${amount.toFixed(2)} expense</p>
            <p className="text-sm text-muted-foreground">{analytics.ai_insight}</p>
          </div>
        ),
      });

      // Reset form
      setFormData({ 
        amount: '', 
        title: '', 
        notes: '', 
        category: '', 
        date: new Date() 
      });
      setCustomCategory('');
      
      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Add New Expense</h1>
            <p className="text-muted-foreground">
              Track your spending by adding a new expense entry.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5 text-primary" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="pl-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="e.g., Grocery shopping"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">+ Add Custom Category</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {formData.category === 'custom' && (
                      <Input
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && handleInputChange('date', date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional details about this expense..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Expense'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AddExpense;