import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { getErrorMessage } from '../services/api';
import { useNotify } from './useNotify';

interface Options<T> {
  title: string;
  message: (item: T) => string;
  remove: (item: T) => Promise<void>;
  onDeleted: () => void;
  successMessage: string;
}

/** Wires a "Delete?" confirmation dialog to an API call, with success / error notifications. */
export function useDeleteAction<T>({ title, message, remove, onDeleted, successMessage }: Options<T>) {
  const [target, setTarget] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await remove(target);
      notify.success(successMessage);
      setTarget(null);
      onDeleted();
    } catch (e) {
      notify.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const dialog: ReactNode = (
    <ConfirmDialog
      open={target !== null}
      title={title}
      message={target ? message(target) : ''}
      confirmLabel="Delete"
      destructive
      loading={busy}
      onConfirm={confirm}
      onClose={() => setTarget(null)}
    />
  );

  return { askDelete: setTarget, dialog };
}
