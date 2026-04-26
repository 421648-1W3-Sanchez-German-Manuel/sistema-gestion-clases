import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, destructive = true }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || '¿Estás seguro?'}</AlertDialogTitle>
          <AlertDialogDescription>{description || 'Esta acción no se puede deshacer.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-delete-dialog-cancel">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirm-delete-dialog-confirm-button"
            className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            onClick={onConfirm}
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
