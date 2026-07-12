import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  console.log('INTERCEPTOR EXECUTOU');

  const token = localStorage.getItem('taskflow_access_token');

  console.log('TOKEN:', token);

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};