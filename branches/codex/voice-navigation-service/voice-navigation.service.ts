import { Service } from '@toeverything/infra';

import type { VoiceNavigationContext } from '../types';

export type ContextChangeListener = (context: VoiceNavigationContext) => void;

/**
 * Tracks the active UI/document/workspace context so voice commands can make
 * decisions based on where the user currently is in the app.
 */
export class VoiceNavigationService extends Service {
  private initialized = false;
  private readonly historyLimit = 20;

  private context: VoiceNavigationContext = {
    workspace: null,
    document: null,
    currentView: 'unknown',
    activeElement: undefined,
    navigationHistory: [],
    sidebarOpen: false,
  };

  private readonly listeners = new Set<ContextChangeListener>();

  private readonly handleFocus = (event: FocusEvent) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    const element = event.target;
    const identifier = element.id || element.getAttribute('data-testid') || element.tagName.toLowerCase();
    this.updateContext({ activeElement: identifier ?? undefined });
  };

  private readonly handleLocationChange = () => {
    const view = this.computeCurrentView();
    this.recordNavigation(view);
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.context = this.captureInitialContext();

    if (this.isBrowser()) {
      window.addEventListener('focusin', this.handleFocus, { passive: true });
      window.addEventListener('popstate', this.handleLocationChange, { passive: true });
      window.addEventListener('hashchange', this.handleLocationChange, { passive: true });
    }

    this.initialized = true;
  }

  dispose(): void {
    if (!this.initialized || !this.isBrowser()) {
      return;
    }

    window.removeEventListener('focusin', this.handleFocus);
    window.removeEventListener('popstate', this.handleLocationChange);
    window.removeEventListener('hashchange', this.handleLocationChange);

    this.listeners.clear();
    this.initialized = false;
  }

  onContextChange(listener: ContextChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.cloneContext());
    return () => this.listeners.delete(listener);
  }

  getCurrentContext(): VoiceNavigationContext {
    return this.cloneContext();
  }

  updateContext(update: Partial<VoiceNavigationContext>): VoiceNavigationContext {
    const next: VoiceNavigationContext = {
      ...this.context,
      ...update,
      workspace: update.workspace ?? this.context.workspace,
      document: update.document ?? this.context.document,
      navigationHistory: update.navigationHistory ?? this.context.navigationHistory,
    };

    this.context = next;
    this.notify();
    return this.context;
  }

  setWorkspace(workspace: VoiceNavigationContext['workspace']): void {
    this.updateContext({ workspace });
  }

  setDocument(document: VoiceNavigationContext['document']): void {
    this.updateContext({ document });
  }

  setSidebarState(isOpen: boolean): void {
    if (this.context.sidebarOpen === isOpen) {
      return;
    }
    this.updateContext({ sidebarOpen: isOpen });
  }

  recordNavigation(view: string): void {
    const normalizedView = view || 'unknown';
    const history = [...this.context.navigationHistory, normalizedView].slice(-this.historyLimit);
    this.context = {
      ...this.context,
      currentView: normalizedView,
      navigationHistory: history,
    };
    this.notify();
  }

  private captureInitialContext(): VoiceNavigationContext {
    const view = this.computeCurrentView();

    return {
      workspace: this.readWorkspaceMetadata(),
      document: this.readDocumentMetadata(),
      currentView: view,
      activeElement: this.readActiveElement(),
      navigationHistory: view ? [view] : [],
      sidebarOpen: this.detectSidebarState(),
    };
  }

  private computeCurrentView(): string {
    if (!this.isBrowser()) {
      return 'unknown';
    }

    const { pathname, hash } = window.location;
    const base = pathname.replace(/\/+$/, '') || '/';
    return hash ? `${base}${hash}` : base;
  }

  private readWorkspaceMetadata(): VoiceNavigationContext['workspace'] {
    if (!this.isBrowser()) {
      return null;
    }

    const globalAffine = (window as unknown as { affine?: any }).affine;
    if (globalAffine?.workspace) {
      const { id, name } = globalAffine.workspace;
      if (typeof id === 'string') {
        return { id, name: typeof name === 'string' ? name : id };
      }
    }

    const meta = document.querySelector('[data-workspace-id]');
    if (meta instanceof HTMLElement) {
      const id = meta.getAttribute('data-workspace-id');
      if (id) {
        return {
          id,
          name: meta.getAttribute('data-workspace-name') ?? id,
        };
      }
    }

    return null;
  }

  private readDocumentMetadata(): VoiceNavigationContext['document'] {
    if (!this.isBrowser()) {
      return null;
    }

    const docElement = document.querySelector('[data-doc-id]');
    if (docElement instanceof HTMLElement) {
      const id = docElement.getAttribute('data-doc-id');
      if (id) {
        return {
          id,
          title: docElement.getAttribute('data-doc-title') ?? id,
          type: docElement.getAttribute('data-doc-type') ?? 'unknown',
        };
      }
    }

    return null;
  }

  private readActiveElement(): string | undefined {
    if (!this.isBrowser()) {
      return undefined;
    }

    const element = document.activeElement as HTMLElement | null;
    if (!element) {
      return undefined;
    }

    return element.id || element.getAttribute('data-testid') || element.tagName.toLowerCase();
  }

  private detectSidebarState(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    const sidebar = document.querySelector('[data-affine-sidebar]');
    if (!(sidebar instanceof HTMLElement)) {
      return false;
    }

    return !sidebar.hasAttribute('aria-hidden');
  }

  private notify(): void {
    const snapshot = this.cloneContext();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private cloneContext(): VoiceNavigationContext {
    return {
      workspace: this.context.workspace ? { ...this.context.workspace } : null,
      document: this.context.document ? { ...this.context.document } : null,
      currentView: this.context.currentView,
      activeElement: this.context.activeElement,
      navigationHistory: [...this.context.navigationHistory],
      sidebarOpen: this.context.sidebarOpen,
    };
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}
