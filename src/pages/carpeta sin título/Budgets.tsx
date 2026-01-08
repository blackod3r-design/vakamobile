import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

const iconList = [
  'ShoppingCart', 'Coffee', 'Car', 'Home', 'Utensils', 'Film', 'Heart',
  'Book', 'Dumbbell', 'Shirt', 'Zap', 'Wifi', 'Gift', 'Briefcase'
];

const Budgets = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory } = useData();
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    assignedAmount: 0,
    color: '#3b82f6',
    icon: 'Wallet',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    assignedAmount: 0,
    currentSpending: 0,
    color: '#10b981',
    icon: 'ShoppingCart',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudget) {
      updateBudget(editingBudget.id, {
        ...formData,
        assignedAmount: Number(formData.assignedAmount),
      });
      toast.success('Presupuesto actualizado');
    } else {
      addBudget({
        ...formData,
        assignedAmount: Number(formData.assignedAmount),
        currentSpending: 0,
      });
      toast.success('Presupuesto creado');
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    
    if (editingCategory) {
      updateBudgetCategory(selectedBudget, editingCategory.id, {
        ...categoryFormData,
        assignedAmount: Number(categoryFormData.assignedAmount),
        currentSpending: Number(categoryFormData.currentSpending),
      });
      toast.success('Categoría actualizada');
    } else {
      addBudgetCategory(selectedBudget, {
        ...categoryFormData,
        assignedAmount: Number(categoryFormData.assignedAmount),
        currentSpending: Number(categoryFormData.currentSpending),
      });
      toast.success('Categoría agregada');
    }
    resetCategoryForm();
    setIsCategoryDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      assignedAmount: 0,
      color: '#3b82f6',
      icon: 'Wallet',
    });
    setEditingBudget(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      assignedAmount: 0,
      currentSpending: 0,
      color: '#10b981',
      icon: 'ShoppingCart',
    });
    setEditingCategory(null);
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      assignedAmount: budget.assignedAmount,
      color: budget.color,
      icon: budget.icon,
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      assignedAmount: category.assignedAmount,
      currentSpending: category.currentSpending,
      color: category.color,
      icon: category.icon,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
      deleteBudget(id);
      toast.success('Presupuesto eliminado');
    }
  };

  const handleDeleteCategory = (budgetId: string, categoryId: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      deleteBudgetCategory(budgetId, categoryId);
      toast.success('Categoría eliminada');
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Wallet;
    return Icon;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 animate-fade-in overflow-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Presupuestos</h1>
          <p className="text-muted-foreground">Gestiona tus presupuestos y categorías de gasto</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Presupuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Editar' : 'Nuevo'} Presupuesto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Monto Asignado</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.assignedAmount}
                  onChange={(e) => setFormData({ ...formData, assignedAmount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div>
                <Label>Ícono</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {iconList.map((iconName) => {
                    const IconComponent = getIconComponent(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2 rounded border-2 transition-smooth ${
                          formData.icon === iconName ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const IconComponent = getIconComponent(budget.icon);
          const progressPercent = budget.assignedAmount > 0 
            ? (budget.currentSpending / budget.assignedAmount) * 100 
            : 0;
          const isOverBudget = progressPercent > 100;
          
          return (
            <Card key={budget.id} className="p-6 hover:shadow-lg transition-smooth">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: budget.color + '20' }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: budget.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{budget.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${budget.currentSpending.toLocaleString()} / ${budget.assignedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-2 hover:bg-accent rounded-lg transition-smooth"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-smooth"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Progress 
                value={Math.min(progressPercent, 100)} 
                className={`h-2 mb-4 ${isOverBudget ? '[&>div]:bg-destructive' : ''}`}
              />

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold">Categorías</p>
                  <Dialog open={isCategoryDialogOpen && selectedBudget === budget.id} onOpenChange={(open) => {
                    setIsCategoryDialogOpen(open);
                    if (!open) {
                      resetCategoryForm();
                      setSelectedBudget(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <button
                        onClick={() => setSelectedBudget(budget.id)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar' : 'Nueva'} Categoría</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={categoryFormData.name}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Monto Asignado</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={categoryFormData.assignedAmount}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, assignedAmount: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Gasto Actual</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={categoryFormData.currentSpending}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, currentSpending: Number(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Input
                            type="color"
                            value={categoryFormData.color}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Ícono</Label>
                          <div className="grid grid-cols-7 gap-2 mt-2">
                            {iconList.map((iconName) => {
                              const IconComponent = getIconComponent(iconName);
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setCategoryFormData({ ...categoryFormData, icon: iconName })}
                                  className={`p-2 rounded border-2 transition-smooth ${
                                    categoryFormData.icon === iconName ? 'border-primary bg-primary/10' : 'border-border'
                                  }`}
                                >
                                  <IconComponent className="w-5 h-5" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {budget.categories?.map((category) => {
                    const CategoryIcon = getIconComponent(category.icon);
                    const catProgress = category.assignedAmount > 0 
                      ? (category.currentSpending / category.assignedAmount) * 100 
                      : 0;
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <CategoryIcon className="w-4 h-4" style={{ color: category.color }} />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              ${category.currentSpending} / ${category.assignedAmount}
                            </p>
                            <Progress value={Math.min(catProgress, 100)} className="h-1 w-20" />
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBudget(budget.id);
                              handleEditCategory(category);
                              setIsCategoryDialogOpen(true);
                            }}
                            className="p-1 hover:bg-accent rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(budget.id, category.id)}
                            className="p-1 hover:bg-destructive/10 text-destructive rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(!budget.categories || budget.categories.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">Sin categorías</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Tag className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tienes presupuestos</h3>
          <p className="text-muted-foreground mb-4">Crea tu primer presupuesto para empezar a gestionar tus gastos</p>
        </div>
      )}
    </div>
  );
};

export default Budgets;
