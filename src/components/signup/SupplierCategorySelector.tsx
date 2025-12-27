import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { categoriesData } from '@/data/categories';
import { cn } from '@/lib/utils';

interface SupplierCategorySelectorProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSubcategoriesChange: (subcategories: string[]) => void;
  error?: string;
}

export const SupplierCategorySelector = ({
  selectedCategories,
  selectedSubcategories,
  onCategoriesChange,
  onSubcategoriesChange,
  error
}: SupplierCategorySelectorProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategoryExpanded = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleCategoryToggle = (categoryName: string, checked: boolean) => {
    if (checked) {
      onCategoriesChange([...selectedCategories, categoryName]);
      // Auto-expand when selected
      if (!expandedCategories.includes(categoryName)) {
        setExpandedCategories(prev => [...prev, categoryName]);
      }
    } else {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryName));
      // Remove all subcategories of this category
      const category = categoriesData.find(c => c.name === categoryName);
      if (category) {
        const categorySubcats = category.subcategories;
        onSubcategoriesChange(
          selectedSubcategories.filter(sc => !categorySubcats.includes(sc))
        );
      }
    }
  };

  const handleSubcategoryToggle = (subcategory: string, categoryName: string, checked: boolean) => {
    if (checked) {
      onSubcategoriesChange([...selectedSubcategories, subcategory]);
      // Auto-select category if not selected
      if (!selectedCategories.includes(categoryName)) {
        onCategoriesChange([...selectedCategories, categoryName]);
      }
    } else {
      onSubcategoriesChange(selectedSubcategories.filter(sc => sc !== subcategory));
    }
  };

  const removeSubcategory = (subcategory: string) => {
    onSubcategoriesChange(selectedSubcategories.filter(sc => sc !== subcategory));
  };

  const getSubcategoriesForCategory = (categoryName: string) => {
    return selectedSubcategories.filter(sc => {
      const category = categoriesData.find(c => c.name === categoryName);
      return category?.subcategories.includes(sc);
    });
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">
        Categories & Subcategories You Deal In *
      </Label>
      <p className="text-xs text-muted-foreground">
        Select at least one category and one subcategory. You'll receive email notifications for matching requirements.
      </p>

      {/* Selected subcategories display */}
      {selectedSubcategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-md">
          {selectedSubcategories.slice(0, 10).map(subcat => (
            <Badge 
              key={subcat} 
              variant="secondary" 
              className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => removeSubcategory(subcat)}
            >
              {subcat}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {selectedSubcategories.length > 10 && (
            <Badge variant="outline" className="text-xs">
              +{selectedSubcategories.length - 10} more
            </Badge>
          )}
        </div>
      )}

      <ScrollArea className={cn(
        "h-[250px] border rounded-md p-2",
        error && "border-destructive"
      )}>
        <div className="space-y-1">
          {categoriesData.map(category => {
            const isSelected = selectedCategories.includes(category.name);
            const isExpanded = expandedCategories.includes(category.name);
            const selectedSubcatsCount = getSubcategoriesForCategory(category.name).length;
            const Icon = category.icon;

            return (
              <div key={category.name} className="border-b last:border-b-0 pb-1">
                <div 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center space-x-2 flex-1" onClick={() => toggleCategoryExpanded(category.name)}>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{category.name}</span>
                    {selectedSubcatsCount > 0 && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {selectedSubcatsCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleCategoryToggle(category.name, !!checked)}
                    />
                    <button 
                      type="button"
                      onClick={() => toggleCategoryExpanded(category.name)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-6 mt-1 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[200px] overflow-y-auto">
                    {category.subcategories.map(subcat => (
                      <label 
                        key={subcat} 
                        className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedSubcategories.includes(subcat)}
                          onCheckedChange={(checked) => handleSubcategoryToggle(subcat, category.name, !!checked)}
                        />
                        <span className="text-xs">{subcat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="text-xs text-muted-foreground">
        Selected: {selectedCategories.length} categories, {selectedSubcategories.length} subcategories
      </div>
    </div>
  );
};
