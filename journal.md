**19/05/2026 11:38 pm**
Inicio de migracion.

**19/05/26 11:42pm - 20/05/26 12:08 am**
Para comenzar nuestra migracion el primer paso sera decidir donde migrar los datos, tenemos dos opciones aqui, continuar con SQLite o migrar a PostgreSQL. En este caso utilizaremos PostgreSQL con la plataforma de **Supabase** ya que de esa manera no dependemos de un servidor local como lo puede ser la propia laptop para correr el sistema, si no, tendremos los datos online en todo momento.

**20/05/26 12:08 am**
Comenzar migrando backend; Nuestro objetivo es utilizar Node + Typescript para el backend asi que en vez de utilizar NodeJs vanilla, utilizaremos NestJs, un framework de NodeJs el cual de inicio tiene una mejor estructura para comenzar. Esto nos servira a largo plazo para poder mantener una estructura clara y facil de mantener.

```
Claude prompt
I want to connect my supabase database with my backend app, variables area already on @api/.env.local , configure the connection for it
```

**20/05/26 12:21 am**
Comenzamos migrando el servicio de auth, dato que el actual sistema legacy no cuenta con seguridad al momento de hacer login (datos se guardan como se obtienen sin hashear ni nada) vamos a implementar JWT.

**20/05/26 1:33 am**
Una vez migrando el primer servicio, utilice Claude code para acelerar el entendimiento y migracion de los distintos servicios dentro de la aplicacion legacy, agilizando todo el flujo considerando el tiempo que se tiene.

```
According to @api/app.py  and @api/src/finance/finance.py  @api/src/exports/exports.py , migrate all functions and api routes to their respective folders into this project
```

**20/05/26 2:13 am**
Para finalizar con la migracion del backend comenzamos generando pruebas unitarias para cada servicio.