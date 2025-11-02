import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState, useEffect, type FormEvent } from "react";
import { API_ENDPOINTS, getEndpointByPath, getMethodDetails } from "@/config/api-endpoints";

export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const endpointInputRef = useRef<HTMLInputElement>(null);
  const requestBodyInputRef = useRef<HTMLTextAreaElement>(null);
  const [selectedEndpointPath, setSelectedEndpointPath] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("GET");
  const [manualEndpoint, setManualEndpoint] = useState<string>("/api/hello");
  const [requestBody, setRequestBody] = useState<string>("");

  const selectedEndpoint = selectedEndpointPath ? getEndpointByPath(selectedEndpointPath) : null;
  const availableMethods = selectedEndpoint ? selectedEndpoint.methods : ["GET", "PUT", "POST", "DELETE", "PATCH"];
  const methodDetails = selectedEndpointPath && selectedMethod 
    ? getMethodDetails(selectedEndpointPath, selectedMethod)
    : null;
  
  const requiresRequestBody = ["PUT", "POST", "PATCH"].includes(selectedMethod);

  // Update request body when method or endpoint changes
  useEffect(() => {
    if (methodDetails?.mockData && requiresRequestBody) {
      const mockDataStr = JSON.stringify(methodDetails.mockData, null, 2);
      setRequestBody(mockDataStr);
      if (requestBodyInputRef.current) {
        requestBodyInputRef.current.value = mockDataStr;
      }
    } else {
      setRequestBody("");
      if (requestBodyInputRef.current) {
        requestBodyInputRef.current.value = "";
      }
    }
  }, [selectedMethod, selectedEndpointPath, methodDetails, requiresRequestBody]);

  const handleEndpointSelect = (path: string) => {
    setSelectedEndpointPath(path);
    const endpoint = getEndpointByPath(path);
    if (endpoint && endpointInputRef.current) {
      endpointInputRef.current.value = path;
      setManualEndpoint(path);
      // Set method to first available method for this endpoint
      if (endpoint.methods.length > 0 && endpoint.methods[0]) {
        setSelectedMethod(endpoint.methods[0]);
      }
    }
  };

  const handleManualEndpointChange = (value: string) => {
    setManualEndpoint(value);
    setSelectedEndpointPath(""); // Clear selection when manually typing
  };

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const endpoint = manualEndpoint.trim();
      if (!endpoint) {
        responseInputRef.current!.value = "Error: Endpoint cannot be empty";
        return;
      }

      const url = new URL(endpoint, location.href);
      
      // Prepare request options
      const requestOptions: RequestInit = {
        method: selectedMethod,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Add request body for PUT/POST/PATCH
      if (requiresRequestBody && requestBody.trim()) {
        try {
          // Validate JSON
          JSON.parse(requestBody);
          requestOptions.body = requestBody;
        } catch (jsonError) {
          responseInputRef.current!.value = `Error: Invalid JSON in request body\n\n${jsonError instanceof Error ? jsonError.message : String(jsonError)}`;
          return;
        }
      }

      const res = await fetch(url, requestOptions);

      // Check if response is OK
      if (!res.ok) {
        const errorText = await res.text();
        responseInputRef.current!.value = `Error ${res.status} ${res.statusText}\n\n${errorText}`;
        return;
      }

      // Check content type before parsing JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        responseInputRef.current!.value = JSON.stringify(data, null, 2);
      } else {
        // If not JSON, get as text
        const text = await res.text();
        responseInputRef.current!.value = `Response (${contentType || "unknown"}):\n\n${text}`;
      }
    } catch (error) {
      responseInputRef.current!.value = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={testEndpoint} className="flex flex-col gap-4">
        {/* Type Information */}
        {methodDetails && (
          <div className="rounded-md border bg-muted/50 p-3 text-sm">
            {methodDetails.requestType && (
              <div className="mb-1">
                <span className="font-medium">Request Type:</span>{" "}
                <code className="text-xs">{methodDetails.requestType}</code>
              </div>
            )}
            {methodDetails.responseType && (
              <div>
                <span className="font-medium">Response Type:</span>{" "}
                <code className="text-xs">{methodDetails.responseType}</code>
              </div>
            )}
            {methodDetails.description && (
              <div className="mt-2 text-muted-foreground">{methodDetails.description}</div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Label htmlFor="method" className="sr-only">
            Method
          </Label>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger className="w-[100px]" id="method">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent align="start">
              {availableMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="endpoint-select" className="sr-only">
            Select Endpoint
          </Label>
          <Select value={selectedEndpointPath} onValueChange={handleEndpointSelect}>
            <SelectTrigger className="w-[250px]" id="endpoint-select">
              <SelectValue placeholder="Select endpoint..." />
            </SelectTrigger>
            <SelectContent>
              {API_ENDPOINTS.map((endpoint) => (
                <SelectItem key={endpoint.path} value={endpoint.path}>
                  <div className="flex flex-col">
                    <span>{endpoint.path}</span>
                    {endpoint.description && (
                      <span className="text-xs text-left text-muted-foreground">{endpoint.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="endpoint" className="sr-only">
            Endpoint
          </Label>
          <Input
            ref={endpointInputRef}
            id="endpoint"
            type="text"
            name="endpoint"
            value={manualEndpoint}
            onChange={(e) => handleManualEndpointChange(e.target.value)}
            placeholder="/api/hello"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Send
          </Button>
        </div>
        
        {/* Request Body for PUT/POST/PATCH */}
        {requiresRequestBody && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="request-body">
              Request Body {methodDetails?.requestType && `(${methodDetails.requestType})`}
            </Label>
            <Textarea
              ref={requestBodyInputRef}
              id="request-body"
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="{}"
              className="min-h-[120px] font-mono resize-y"
            />
            {methodDetails?.mockData !== undefined && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const mockDataStr = JSON.stringify(methodDetails!.mockData, null, 2);
                  setRequestBody(mockDataStr);
                  if (requestBodyInputRef.current) {
                    requestBodyInputRef.current.value = mockDataStr;
                  }
                }}
              >
                Use Mock Data
              </Button>
            )}
          </div>
        )}
      </form>
      
      <div className="flex flex-col gap-2">
        <Label htmlFor="response">Response</Label>
        <Textarea
          ref={responseInputRef}
          id="response"
          readOnly
          placeholder="Response will appear here..."
          className="min-h-[140px] font-mono resize-y"
        />
      </div>
    </div>
  );
}
