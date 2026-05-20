**19/05/2026 11:38 pm**
Inicio de migracion.

**19/05/26 11:42pm - 20/05/26 12:08 am**
Para comenzar nuestra migracion el primer paso sera decidir donde migrar los datos, tenemos dos opciones aqui, continuar con SQLite o migrar a PostgreSQL. En este caso utilizaremos PostgreSQL con la plataforma de **Supabase** ya que de esa manera no dependemos de un servidor local como lo puede ser la propia laptop para correr el sistema, si no, tendremos los datos online en todo momento.

**20/05/26 12:08 am**
Comenzar migrando backend; Nuestor objetivo es utilizar Node + Typescript para el backend asi que en vez de utilizar NodeJs vanilla, utilizaremos NestJs, un framework de NodeJs el cual de inicio tiene una mejor estructura para comenzar. Esto nos servira a largo plazo para poder mantener una estructura clara y facil de mantener.

**20/05/26 12:21 am**
Comenzamos migrando el servicio de auth, dato que el actual sistema legacy no cuenta con seguridad al momento de hacer login (datos se guardan como se obtienen sin hashear ni nada) vamos a implementar JWT tokens