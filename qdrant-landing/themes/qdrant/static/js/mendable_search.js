document.addEventListener('DOMContentLoaded', () => {
    // Load the external dependencies
    function loadScript(src, onLoadCallback) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = onLoadCallback;
      document.head.appendChild(script);
    }
  
    function createRootElement() {
      const rootElement = document.createElement('div');
      rootElement.id = 'my-component-root';
      document.body.appendChild(rootElement);
      return rootElement;
    }
  
  
  
    function initializeMendable() {
      const rootElement = createRootElement();
      const { MendableFloatingButton } = Mendable;
  
  
      const imageUrl = 'https://qdrant.tech/images/android-chrome-512x512.png';

      const icon = React.createElement('img', {
        src: imageUrl,
        alt: 'Icon',
        style: {
          width: '48px',
          height: '48px',
          margin: '0px',
          padding: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });

  
  
  
  
      const mendableFloatingButton = React.createElement(
        MendableFloatingButton,
        {
          hintText: 'How do I deploy Qdrant?',
          style: { darkMode: false, accentColor: '#394b7a' },
          floatingButtonStyle: { color: '#ffffff', backgroundColor: '#394b7a' },
          anon_key: 'f1781c9c-23be-4ac4-91b4-d2cc18fe559c', // Mendable Search Public ANON key, ok to be public
          icon: icon,
  
        }
      );
  
      ReactDOM.render(mendableFloatingButton, rootElement);
    }
  
    loadScript('https://unpkg.com/react@17/umd/react.production.min.js', () => {
      loadScript('https://unpkg.com/react-dom@17/umd/react-dom.production.min.js', () => {
        loadScript('https://unpkg.com/@mendable/search@0.0.83/dist/umd/mendable.min.js', initializeMendable);
      });
    });
  });