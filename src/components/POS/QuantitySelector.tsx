import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { getUnitDisplay, getUnitOptions, getUnitMultiplier } from '@/lib/units';

interface QuantitySelectorProps {
  quantity: number;
  productName?: string;
  category?: string;
  maxStock?: number;
  onQuantityChange: (quantity: number) => void;
  onRemove?: () => void;
  showUnitSelector?: boolean;
  allowBulkPricing?: boolean;
  currentPrice?: number;
  onPriceChange?: (price: number) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onGetTotalQuantity?: (getTotalQuantity: () => number) => void;
}

export const QuantitySelector = ({
  quantity,
  productName,
  category,
  maxStock,
  onQuantityChange,
  onRemove,
  showUnitSelector = false,
  allowBulkPricing = false,
  currentPrice,
  onPriceChange,
  onKeyDown,
  onGetTotalQuantity
}: QuantitySelectorProps) => {
  const [selectedUnit, setSelectedUnit] = useState('pcs');
  const [unitQuantity, setUnitQuantity] = useState(0);
  const [customPrice, setCustomPrice] = useState<string>('');

  const unitOptions = getUnitOptions(productName, category);
  const unitDisplay = getUnitDisplay(quantity, productName, category);
  const canEditPrice = allowBulkPricing && quantity >= 12;

  // Initialize unit selector based on category
  useEffect(() => {
    if (category === 'Kertas') {
      setSelectedUnit('rim');
    } else {
      setSelectedUnit('pcs');
    }
  }, [category]);

  // Reset unit quantity when main quantity is reset to 0
  useEffect(() => {
    if (quantity === 0) {
      setUnitQuantity(0);
    }
  }, [quantity]);

  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(0, newQuantity);
    console.log('Direct quantity change:', { newQuantity, validQuantity });
    onQuantityChange(validQuantity);
  };

  const handleUnitQuantityChange = (value: number) => {
    if (value < 0) return;
    setUnitQuantity(value);
  };

  // Get total quantity including unit conversions for external use
  const getTotalQuantity = () => {
    const multiplier = getUnitMultiplier(selectedUnit, category);
    return quantity + (unitQuantity * multiplier);
  };

  // Expose getTotalQuantity to parent component
  useEffect(() => {
    if (onGetTotalQuantity) {
      onGetTotalQuantity(getTotalQuantity);
    }
  }, [quantity, unitQuantity, selectedUnit, category, onGetTotalQuantity]);

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
  };

  const handlePriceChange = (value: string) => {
    setCustomPrice(value);
    const price = parseFloat(value);
    if (!isNaN(price) && onPriceChange) {
      onPriceChange(price);
    }
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    handleQuantityChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="space-y-3 quantity-selector">
      {/* Main quantity controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleQuantityChange(quantity - 1);
          }}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Input
          type="number"
          value={quantity || ''}
          onChange={handleQuantityInputChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          className="h-8 w-20 text-center text-sm"
          min="0"
          max={maxStock}
          placeholder="0"
          inputMode="numeric"
        />
        
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleQuantityChange(quantity + 1);
          }}
          disabled={maxStock !== undefined && quantity >= maxStock}
        >
          <Plus className="h-3 w-3" />
        </Button>

        {onRemove && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 ml-2 text-error hover:bg-error hover:text-error-foreground"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Unit selector */}
      {showUnitSelector && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={unitQuantity || ''}
              onChange={(e) => handleUnitQuantityChange(parseInt(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="h-8 w-16 text-center text-sm"
              min="0"
              placeholder="0"
              inputMode="numeric"
            />
            <Select value={selectedUnit} onValueChange={handleUnitChange}>
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (unitQuantity > 0) {
                  const multiplier = getUnitMultiplier(selectedUnit, category);
                  const additionalQuantity = unitQuantity * multiplier;
                  handleQuantityChange(quantity + additionalQuantity);
                  setUnitQuantity(0);
                }
              }}
              disabled={!unitQuantity || unitQuantity <= 0}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Display unit conversions */}
      {unitDisplay.length > 0 && quantity > 0 && (
        <div className="flex flex-wrap gap-1">
          {unitDisplay.slice(1).map((conversion, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {conversion.display}
            </Badge>
          ))}
        </div>
      )}

      {/* Bulk pricing editor */}
      {canEditPrice && onPriceChange && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Harga khusus:
          </Label>
          <Input
            type="number"
            value={customPrice || ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="h-8 text-sm"
            placeholder="Harga per lusin"
            min="0"
            inputMode="decimal"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </div>
  );
};