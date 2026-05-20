**Architecture Decision Records**

1. Base de datos; Seguir utilizando SQLite o migrar a otro servicio?
Para comenzar nuestra migracion un punto clave es decidir que hacer con la base de datos; deberiamos continuar utilizando SQLite o lo migramos a otro servicio ya sea utilizando continuando usando una base de datos relacional como PostgreSQL o migrar a una base de datos no relacional como MongoDB.
Considerando la estructura de los datos decidi continuar con una base de datos relacional pero tambien decidi dejar de lado SQLite para migrar a una plataforma como Supabase, asi los datos estaran mas disponibles que en un servidor SQLite que aunque es una base ligera, sigue siendo una solucion local que no necesita mucho setup a corto plazo pero a largo plazo puede darnos problema cuando el proyecto escale.

2.



3.