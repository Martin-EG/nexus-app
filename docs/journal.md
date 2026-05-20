**19/05/2026 11:38 pm**
Inicio de migracion.

**19/05/26 11:42pm - 20/05/26 12:08 am**
Para comenzar nuestra migracion el primer paso sera decidir donde migrar los datos, tenemos dos opciones aqui, continuar con SQLite o migrar a PostgreSQL. En este caso utilizaremos PostgreSQL con la plataforma de **Supabase** ya que de esa manera no dependemos de un servidor local como lo puede ser la propia laptop para correr el sistema, si no, tendremos los datos online en todo momento.

**20/05/26 12:08 am**
Comenzar migrando backend; Nuestro objetivo es utilizar Node + Typescript para el backend asi que en vez de utilizar NodeJs vanilla, utilizaremos NestJs, un framework de NodeJs el cual de inicio tiene una mejor estructura para comenzar. Esto nos servira a largo plazo para poder mantener una estructura clara y facil de mantener.

```
Claude prompt:
I want to connect my supabase database with my backend app, variables area already on @api/.env.local , configure the connection for it
```

**20/05/26 12:21 am**
Comenzamos migrando el servicio de auth, dato que el actual sistema legacy no cuenta con seguridad al momento de hacer login (datos se guardan como se obtienen sin hashear ni nada) vamos a implementar JWT.

**20/05/26 1:33 am**
Una vez migrando el primer servicio, utilice Claude code para acelerar el entendimiento y migracion de los distintos servicios dentro de la aplicacion legacy, agilizando todo el flujo considerando el tiempo que se tiene.

```
Claude prompt:
According to @api/app.py  and @api/src/finance/finance.py  @api/src/exports/exports.py , migrate all functions and api routes to their respective folders into this project
```

**20/05/26 2:13 am**
Para finalizar con la migracion del backend comenzamos generando pruebas unitarias para cada servicio, con la ayuda de Claude code siguiendola misma estructura de nuestro primer spec file.
```
Create spec file for each service using the same structure as @api/src/auth/auth.service.spec.ts
```

**20/05/26 2:53am**
Agregue un README.md al proyecto de backend.
```
Claude prompt:
Create a readme .md file for API folder, what makes the project, structure, how to make it run, needed data (without making keys visible), useful scripts like npm run start:dev and npm run test
```

**20/05/26 2:55am**
Ahora pase al proyecto de frontend, para la migracion utilizaremos NextJS que ya tiene un sistema de enrutamiento implementado el cual sera de bastante utilidad al agregar mas paginas al proyecto.

**20/05/26 4:22am**
En proceso de migrar cada pagina, para los estilos considere utiliar tailwind asi podemos darle estilos mas estandares, a futuro se puede considerar generar un paquete de estilos propios para no depender de una libreria de terceros.

**20/05/26 5:55 am**
Finalizando de migrar todas las paginas, ciertos componentes que se repetian fueron movidos a sus propios ficheros, como Header, Table, asi como un nuevo middleware que checa si el usuario es admin para renderizar cierta seccion sin 
tener que estar llamando el bucket de zustand en cada archivo.

**20/05/26 6:07 am** 
Una vez finalizado el desarrollo, continuo validando que la aplicacion cuente con el standard de a11y, para esto me apoyo de Claude code para hacer el proceso mas rapido. 

```
Claude prompt
I need to validate accessibility is in order, specially for inputs and interactive components, review all pages looking for validate accessibility is in place, when you find anything wrong, fix it.
```

**20/05/26 6:44 am**
Para finalizar con frontend cree los archivos Readme.md tanto del proyecto de frontend como el general y agregue las pruebas unitarias para los componentes y paginas, con ayuda de Claude, configure y rapidamente realice los archivos de pruebas unitarias en lo que continuaba revisando que todo funcionara como deberia.