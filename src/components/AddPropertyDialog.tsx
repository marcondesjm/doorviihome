import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAddProperty } from '@/hooks/useProperties';
import { useToast } from '@/hooks/use-toast';

interface AddPropertyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function AddPropertyDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  showTrigger = true 
}: AddPropertyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const addProperty = useAddProperty();
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !address.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    try {
      await addProperty.mutateAsync({ name, address });
      toast({
        title: 'Propriedade adicionada!',
        description: `${name} foi adicionada com sucesso`
      });
      setName('');
      setAddress('');
      setOpen(false);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a propriedade',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>Nova Propriedade</DialogTitle>
          <DialogDescription>
            Adicione um novo endereço para gerenciar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="property-name">Nome</Label>
            <Input
              id="property-name"
              placeholder="Ex: Apartamento Centro"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="property-address">Endereço</Label>
            <Input
              id="property-address"
              placeholder="Ex: Av. Paulista, 1000 - Apto 42"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addProperty.isPending}>
              {addProperty.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}