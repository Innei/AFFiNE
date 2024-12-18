/**
 * this file is modified from part of https://github.com/ionic-team/capacitor/blob/74c3e9447e1e32e73f818d252eb12f453d849e8d/ios/Capacitor/Capacitor/assets/native-bridge.js#L466
 *
 * for support arraybuffer response type
 */
import { RawFetchProvider } from '@affine/core/modules/cloud/provider/fetch';
import { CapacitorHttp } from '@capacitor/core';
import type { Framework } from '@toeverything/infra';

const readFileAsBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result;
      if (data === null) {
        reject(new Error('Failed to read file'));
      } else {
        resolve(btoa(data as string));
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
const convertFormData = async (formData: FormData) => {
  const newFormData = [];
  for (const pair of formData.entries()) {
    const [key, value] = pair;
    if (value instanceof File) {
      const base64File = await readFileAsBase64(value);
      newFormData.push({
        key,
        value: base64File,
        type: 'base64File',
        contentType: value.type,
        fileName: value.name,
      });
    } else {
      newFormData.push({ key, value, type: 'string' });
    }
  }
  return newFormData;
};
const convertBody = async (body: unknown, contentType: string) => {
  if (body instanceof ReadableStream || body instanceof Uint8Array) {
    let encodedData;
    if (body instanceof ReadableStream) {
      const reader = body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const concatenated = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );
      let position = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, position);
        position += chunk.length;
      }
      encodedData = concatenated;
    } else {
      encodedData = body;
    }
    let data = new TextDecoder().decode(encodedData);
    let type;
    if (contentType === 'application/json') {
      try {
        data = JSON.parse(data);
      } catch {
        // ignore
      }
      type = 'json';
    } else if (contentType === 'multipart/form-data') {
      type = 'formData';
    } else if (
      contentType === null || contentType === void 0
        ? void 0
        : contentType.startsWith('image')
    ) {
      type = 'image';
    } else if (contentType === 'application/octet-stream') {
      type = 'binary';
    } else {
      type = 'text';
    }
    return {
      data,
      type,
      headers: { 'Content-Type': contentType || 'application/octet-stream' },
    };
  } else if (body instanceof URLSearchParams) {
    return {
      data: body.toString(),
      type: 'text',
    };
  } else if (body instanceof FormData) {
    const formData = await convertFormData(body);
    return {
      data: formData,
      type: 'formData',
    };
  } else if (body instanceof File) {
    const fileData = await readFileAsBase64(body);
    return {
      data: fileData,
      type: 'file',
      headers: { 'Content-Type': body.type },
    };
  }
  return { data: body, type: 'json' };
};
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const binaryArray = [...binaryString].map(function (char) {
    return char.charCodeAt(0);
  });
  return new Uint8Array(binaryArray);
}
export function configureFetchProvider(framework: Framework) {
  framework.override(RawFetchProvider, {
    fetch: async (input, init) => {
      const request = new Request(input, init);
      const { method } = request;
      const tag = `CapacitorHttp fetch ${Date.now()} ${input}`;
      console.time(tag);
      try {
        const { body } = request;
        const optionHeaders = Object.fromEntries(request.headers.entries());
        const {
          data: requestData,
          type,
          headers,
        } = await convertBody(
          (init === null || init === void 0 ? void 0 : init.body) ||
            body ||
            undefined,
          optionHeaders['Content-Type'] || optionHeaders['content-type']
        );
        const accept = optionHeaders['Accept'] || optionHeaders['accept'];
        const nativeResponse = await CapacitorHttp.request({
          url: request.url,
          method: method,
          data: requestData,
          dataType: type as any,
          responseType:
            accept === 'application/octet-stream' ? 'arraybuffer' : undefined,
          headers: Object.assign(Object.assign({}, headers), optionHeaders),
        });
        const contentType =
          nativeResponse.headers['Content-Type'] ||
          nativeResponse.headers['content-type'];
        let data =
          accept === 'application/octet-stream'
            ? base64ToUint8Array(nativeResponse.data)
            : contentType === null || contentType === void 0
              ? void 0
              : contentType.startsWith('application/json')
                ? JSON.stringify(nativeResponse.data)
                : contentType === 'application/octet-stream'
                  ? base64ToUint8Array(nativeResponse.data)
                  : nativeResponse.data;

        // use null data for 204 No Content HTTP response
        if (nativeResponse.status === 204) {
          data = null;
        }
        // intercept & parse response before returning
        const response = new Response(new Blob([data], { type: contentType }), {
          headers: nativeResponse.headers,
          status: nativeResponse.status,
        });
        /*
         * copy url to response, `cordova-plugin-ionic` uses this url from the response
         * we need `Object.defineProperty` because url is an inherited getter on the Response
         * see: https://stackoverflow.com/a/57382543
         * */
        Object.defineProperty(response, 'url', {
          value: nativeResponse.url,
        });
        console.timeEnd(tag);
        return response;
      } catch (error) {
        console.timeEnd(tag);
        throw error;
      }
    },
  });
}
