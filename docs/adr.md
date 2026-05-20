**Architecture Decision Records**

1. Base de datos; Seguir utilizando SQLite o migrar a otro servicio?
Para comenzar nuestra migracion un punto clave es decidir que hacer con la base de datos; deberiamos continuar utilizando SQLite o lo migramos a otro servicio ya sea utilizando continuando usando una base de datos relacional como PostgreSQL o migrar a una base de datos no relacional como MongoDB.
Considerando la estructura de los datos decidi continuar con una base de datos relacional pero tambien decidi dejar de lado SQLite para migrar a una plataforma como Supabase, asi los datos estaran mas disponibles que en un servidor SQLite que aunque es una base ligera, sigue siendo una solucion local que no necesita mucho setup a corto plazo pero a largo plazo puede darnos problema cuando el proyecto escale.

2. Bakend; NodeJs solo o un framework como NestJS?
El elegir tecnolgias para una migracion es una decision critica del proyecto. Utilizar nodejs puro o estructurarlo con un framework como Nestjs? Por un lado NodeJs nos da una clara flexibilidad de poder adaptar nuestro proyecto a nuestra conveniencia y deseo pero NestJs nos permite tener una mejor estructura del proyecto, claro que podemos conseguir lo mismo con NodeJs pero una vez el proyecto escale sera mas dificil mantener la misma estructura. Cosa que con NestJs podemos asegurar una estructura desde el inicio de nuestra migracion.

3.