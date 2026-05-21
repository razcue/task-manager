export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/login', '/register']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
  if (user.value && publicRoutes.includes(to.path)) {
    return navigateTo('/dashboard')
  }
})
