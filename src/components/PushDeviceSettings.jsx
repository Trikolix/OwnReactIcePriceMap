import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Bell, Monitor, RefreshCw } from 'lucide-react';
import { ActionRow, Button, Notice } from './ChallengeUI';
import { disableBrowserPush, disableNativePush, enableBrowserPush, fetchUserWebPushDevices,
  getBrowserPushStatus, initializeNativePush, revokeWebPushDevice } from '../services/pushNotifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const deviceName = agent => {
  const platform = /Android/i.test(agent) ? 'Android' : /iPhone|iPad/i.test(agent) ? 'iPhone / iPad' : /Windows/i.test(agent) ? 'Windows' : /Macintosh/i.test(agent) ? 'Mac' : 'Gerät';
  const browser = /Edg/i.test(agent) ? 'Edge' : /Firefox/i.test(agent) ? 'Firefox' : /Chrome|CriOS/i.test(agent) ? 'Chrome' : /Safari/i.test(agent) ? 'Safari' : 'Browser';
  return `${browser} · ${platform}`;
};
export default function PushDeviceSettings({ userId, settings, onSettingsChanged }) {
  const native = Capacitor.isNativePlatform();
  const [status, setStatus] = useState(null);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => {
    let current;
    if (native) {
      const permissions = await PushNotifications.checkPermissions();
      current = { supported: Capacitor.getPlatform() === 'android', permission: permissions.receive,
        active: permissions.receive === 'granted' && Number(settings.push_enabled_android) === 1 };
    } else current = await getBrowserPushStatus(userId);
    setStatus(current);
    setDevices(await fetchUserWebPushDevices(current.endpoint));
  }, [native, userId, settings.push_enabled_android]);
  useEffect(() => {
    refresh().catch(reason => setError(reason.message));
    const onChanged = () => refresh().catch(reason => setError(reason.message));
    window.addEventListener('push:changed', onChanged);
    return () => window.removeEventListener('push:changed', onChanged);
  }, [refresh]);
  const action = async operation => {
    setBusy(true); setError(''); setNotice('');
    try {
      await operation(); await onSettingsChanged(); await refresh();
      setNotice('Push-Einstellung gespeichert.');
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const nativeToggle = async enabled => {
    if (enabled) await initializeNativePush(userId);
    else await disableNativePush(userId);
    const response = await fetch(`${API_BASE}/api/update_user_notification_settings.php`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ push_enabled_android: enabled ? 1 : 0 }),
    });
    if (!response.ok || !(await response.json()).success) throw new Error('Push-Einstellung konnte nicht gespeichert werden.');
    window.dispatchEvent(new Event('push:changed'));
  };
  const active = status?.active && !status?.deviceDisabled;
  return <Section aria-label="Push auf deinen Geräten">
    <h4><Bell size={19} aria-hidden="true" /> Push auf diesem Gerät</h4>
    <p role="status">{!status ? 'Gerätestatus wird geladen …' : !status.supported ? 'Push wird in diesem Browser nicht unterstützt.'
      : status.permission === 'denied' ? 'Benachrichtigungen sind in den Geräteeinstellungen blockiert.'
        : active ? 'Dieses Gerät ist für Push aktiviert.' : 'Dieses Gerät ist für Push deaktiviert.'}</p>
    {status?.supported && <ActionRow>
      {!active ? <Button type="button" disabled={busy || status.permission === 'denied'} onClick={() => action(() => native ? nativeToggle(true) : enableBrowserPush(userId))}>Auf diesem Gerät aktivieren</Button>
        : <><Button type="button" $secondary disabled={busy} onClick={() => action(() => native ? nativeToggle(true) : enableBrowserPush(userId))}><RefreshCw size={17} aria-hidden="true" />Verbindung erneuern</Button>
          <Button type="button" $secondary disabled={busy} onClick={() => action(() => native ? nativeToggle(false) : disableBrowserPush(userId))}>Dieses Gerät deaktivieren</Button></>}
    </ActionRow>}
    <h4><Monitor size={19} aria-hidden="true" /> Aktivierte Browser</h4>
    {devices.length ? <DeviceList>{devices.map(device => <li key={device.id}>
      <div><strong>{deviceName(device.user_agent || '')}{device.is_current ? ' · dieses Gerät' : ''}</strong>
        {device.last_success_at && <small>Zuletzt erreicht: {device.last_success_at}</small>}
        {device.last_failure_at && <small>Letzter Zustellversuch fehlgeschlagen: {device.last_failure_at}</small>}</div>
      <Button type="button" $secondary disabled={busy} onClick={() => action(() => revokeWebPushDevice(userId, device.id, device.is_current))}
        aria-label={`${deviceName(device.user_agent || '')} deaktivieren`}>Deaktivieren</Button>
    </li>)}</DeviceList> : <p>Keine Browser für Push angemeldet.</p>}
    {devices.length > 1 && <Button type="button" $secondary disabled={busy} onClick={() => action(() => disableBrowserPush(userId, { allDevices: true }))}>Alle Browser deaktivieren</Button>}
    {notice && <Notice role="status">{notice}</Notice>}
    {error && <Notice $error role="alert">{error}<Button type="button" $secondary onClick={() => refresh().then(() => setError('')).catch(reason => setError(reason.message))}>Status erneut laden</Button></Notice>}
  </Section>;
}
const Section = styled.section`margin: 20px 0; padding: 16px; border: 1px solid #eadfc9; border-radius: 14px; background: #fffdf8; color: #5a421b; h4 { display: flex; align-items: center; gap: 8px; margin: 16px 0 8px; } h4:first-child { margin-top: 0; } p { font-size: 14px; line-height: 1.5; }`;
const DeviceList = styled.ul`list-style: none; margin: 0 0 12px; padding: 0; li { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 0; border-bottom: 1px solid #eadfc9; } strong { font-size: 14px; } small { display: block; color: #756951; margin-top: 4px; }`;
