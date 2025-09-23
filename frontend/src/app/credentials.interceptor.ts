import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Csak a relatív kérésekre ("/", "./", "../"), hogy az assetek/CDN ne sérüljenek
  if (req.url.startsWith('/') || req.url.startsWith('./') || req.url.startsWith('../')) {
    return next(req.clone({ withCredentials: true }));
  }
  return next(req);
};
