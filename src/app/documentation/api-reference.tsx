"use client";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
const localDocumentationPlugin = () => ({
  components: { onlineValidatorBadge: () => null },
});
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <p className="help">Loading API reference…</p>,
});
export default function ApiReference() {
  return (
    <div className="api-reference">
      <SwaggerUI
        url="/api/openapi"
        plugins={[localDocumentationPlugin]}
        deepLinking
        displayRequestDuration
        docExpansion="list"
        defaultModelRendering="model"
        defaultModelsExpandDepth={-1}
        tryItOutEnabled={false}
        requestInterceptor={(request) => {
          const target = new URL(request.url, window.location.origin);
          if (target.origin !== window.location.origin)
            throw new Error(
              "The local API reference only sends same-origin requests.",
            );
          return request;
        }}
      />
    </div>
  );
}
