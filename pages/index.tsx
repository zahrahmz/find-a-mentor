import React, { useState, useEffect } from 'react';
import CreateReactAppEntryPoint from '../src/components/App/App';
import { FiltersProvider } from '../src/context/filtersContext/FiltersContext';
import { ModalHookProvider } from '../src/context/modalContext/ModalContext';
import { UserProvider } from '../src/context/userContext/UserContext';

function App() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <UserProvider>
      <FiltersProvider>
        <ModalHookProvider>
          <CreateReactAppEntryPoint />;
        </ModalHookProvider>
      </FiltersProvider>
    </UserProvider>
  );
}

export default App;
