import React, { useEffect } from "react";

import stringify from "json-stringify-pretty-compact";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-json";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/toolbar/prism-toolbar.min.css";
import "prismjs/plugins/toolbar/prism-toolbar.min";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min";

const App = ({ code, language }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <main>
      <pre className="line-numbers" max-height="12">
        <pre
          className="copy-to-clipboard"
          style={{
            height: 800,
            fontSize: 12,
          }}
        >
          <code
            children={stringify(code, { maxLength: 0, indent: 3 })}
            className={`language-${language}`}
          />
        </pre>
      </pre>
    </main>
  );
};

export default App;
