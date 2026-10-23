import { useLocation, useNavigate, type Location } from 'react-router';

export type LogType = 'fuel' | 'ride' | 'service' | 'odometer';

export interface ModalState {
  background?: Location;
}

/** Open the quick-log sheet over the current screen. */
export function useOpenLog() {
  const navigate = useNavigate();
  const location = useLocation();
  return (type?: LogType, bikeId?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (bikeId) params.set('bike', bikeId);
    const background = (location.state as ModalState | null)?.background ?? location;
    navigate(
      { pathname: '/log', search: params.toString() ? `?${params}` : '' },
      { state: { background } satisfies ModalState },
    );
  };
}
