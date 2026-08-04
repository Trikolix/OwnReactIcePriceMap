import ActionsOverviewModal from './ActionsOverview';
import Header from '../Header';
import { useUser } from '../context/UserContext';
import Seo from '../components/Seo';

const ActionsPage = () => {
  const { isLoggedIn } = useUser();

  const openLogin = () => {
    window.dispatchEvent(new CustomEvent('auth:open-login'));
  };

  return (
    <>
      <Seo
        title="Aktionen & Rückblicke | Ice-App"
        description="Entdecke aktuelle Aktionen, kommende Events und historische Ergebnisse der Ice-App."
        canonical="/aktionen"
      />
      <Header />
      <ActionsOverviewModal
        open
        fullPage
        isLoggedIn={isLoggedIn}
        onLogin={openLogin}
      />
    </>
  );
};

export default ActionsPage;
