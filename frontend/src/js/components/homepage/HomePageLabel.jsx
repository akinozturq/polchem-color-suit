import React from 'react';
import { useTranslation } from 'react-i18next';
import { isSiteUser } from '../../api/WebRequest';

const HomePageLabel = () => {
  const [t] = useTranslation();
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <h1 className="text-center start-header directly-over-bg">
            {isSiteUser()
              ? t('fn.createNewOrder', 'Create a new order')
              : t('fn.browseFormulas', 'Browse formulas')}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default HomePageLabel;
