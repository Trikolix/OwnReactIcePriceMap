import { act, renderHook, waitFor } from '@testing-library/react';
import {
  HIDDEN_RELOAD_DELAY_MS,
  useAppVersionCheck,
} from '../../src/hooks/useAppVersionCheck';

const originalOnLine = navigator.onLine;

function setDocumentHidden(value) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value,
  });
}

describe('useAppVersionCheck', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.sessionStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ appVersion: '2.15.0', buildId: '2.15.0-new-build' }),
    });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    setDocumentHidden(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
    setDocumentHidden(false);
    jest.restoreAllMocks();
  });

  it('detects a new build even when the app version is unchanged', async () => {
    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
    expect(result.current.remoteInfo.appVersion).toBe('2.15.0');
  });

  it('does not reload while the document is visible', async () => {
    const reload = jest.fn();
    jest.spyOn(window.location, 'reload').mockImplementation(reload);
    renderHook(() => useAppVersionCheck());

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    act(() => jest.advanceTimersByTime(HIDDEN_RELOAD_DELAY_MS + 1));

    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads after the tab becomes hidden', async () => {
    const reload = jest.fn();
    jest.spyOn(window.location, 'reload').mockImplementation(reload);
    renderHook(() => useAppVersionCheck());
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event('visibilitychange'));
      jest.advanceTimersByTime(HIDDEN_RELOAD_DELAY_MS);
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('ice-app:update-reload-attempt')).toBe('2.15.0-new-build');
  });

  it('cancels a pending reload when the user returns immediately', async () => {
    const reload = jest.fn();
    jest.spyOn(window.location, 'reload').mockImplementation(reload);
    renderHook(() => useAppVersionCheck());
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event('visibilitychange'));
      jest.advanceTimersByTime(HIDDEN_RELOAD_DELAY_MS - 1);
      setDocumentHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
      jest.advanceTimersByTime(10);
    });

    expect(reload).not.toHaveBeenCalled();
  });

  it('does not repeat automatic reloads after an unsuccessful one', async () => {
    window.sessionStorage.setItem('ice-app:update-reload-attempt', '2.15.0-new-build');
    const reload = jest.fn();
    jest.spyOn(window.location, 'reload').mockImplementation(reload);
    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => expect(result.current.reloadFailed).toBe(true));
    setDocumentHidden(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      jest.advanceTimersByTime(HIDDEN_RELOAD_DELAY_MS);
    });

    expect(reload).not.toHaveBeenCalled();
  });
});
