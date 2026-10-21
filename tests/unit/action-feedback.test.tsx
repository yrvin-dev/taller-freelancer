import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ActionFeedbackProvider, useActionFeedback } from '@/components/ActionFeedback';
import { NoteLog } from '@/components/projects/detail/NoteLog';
import { SESSION_EXPIRED, type ActionFailure } from '@/lib/action-result';

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), addNote: vi.fn() }));
vi.mock('@/app/(auth)/login/actions', () => ({ signInWithGoogle: mocks.signIn }));
vi.mock('@/app/(app)/proyectos/[id]/actions', () => ({
  addNote: mocks.addNote,
  deleteNote: vi.fn(),
}));

function Trigger({ result }: { result: ActionFailure }) {
  const { fail } = useActionFeedback();
  return <button onClick={() => fail(result)}>Probar</button>;
}

const renderWith = (result: ActionFailure) =>
  render(
    <ActionFeedbackProvider>
      <Trigger result={result} />
    </ActionFeedbackProvider>,
  );

const expiredDialog = () => screen.queryByRole('dialog', { name: 'Tu sesión expiró' });

beforeEach(() => {
  mocks.signIn.mockReset();
  mocks.addNote.mockReset();
});

describe('ActionFeedbackProvider', () => {
  it('un error común se muestra en el toast, sin diálogo', () => {
    renderWith({ ok: false, error: 'No encontramos ese proyecto.' });
    fireEvent.click(screen.getByRole('button', { name: 'Probar' }));
    expect(screen.getByText('No encontramos ese proyecto.')).toBeInTheDocument();
    expect(expiredDialog()).not.toBeInTheDocument();
  });

  it('code: unauthorized abre el diálogo 401 en lugar del toast', () => {
    renderWith(SESSION_EXPIRED);
    fireEvent.click(screen.getByRole('button', { name: 'Probar' }));
    expect(expiredDialog()).toBeInTheDocument();
    expect(screen.queryByText(SESSION_EXPIRED.error)).not.toBeInTheDocument();
  });

  it('"Entrar de nuevo con Google" vuelve a la misma página', async () => {
    window.history.pushState({}, '', '/proyectos/agb?tab=notas');
    renderWith(SESSION_EXPIRED);
    fireEvent.click(screen.getByRole('button', { name: 'Probar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar de nuevo con Google' }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledTimes(1));
    const form = mocks.signIn.mock.calls[0]![0] as FormData;
    expect(form.get('next')).toBe('/proyectos/agb?tab=notas');
    window.history.pushState({}, '', '/');
  });

  it('useActionFeedback fuera del proveedor falla con un mensaje claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger result={SESSION_EXPIRED} />)).toThrow('ActionFeedbackProvider');
    vi.mocked(console.error).mockRestore();
  });

  it('si la sesión venció al agregar una nota, se abre el diálogo y el texto no se pierde', async () => {
    mocks.addNote.mockResolvedValue(SESSION_EXPIRED);
    render(
      <ActionFeedbackProvider>
        <NoteLog projectId="agb" initialNotes={[]} />
      </ActionFeedbackProvider>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Entrada de la bitácora' });
    fireEvent.change(textarea, { target: { value: 'Cambió el logo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a la bitácora' }));
    await waitFor(() => expect(expiredDialog()).toBeInTheDocument());
    expect(textarea).toHaveValue('Cambió el logo');
  });
});
