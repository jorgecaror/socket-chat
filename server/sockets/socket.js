const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utils/utilidades');

const usuarios = new Usuarios();


io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre y sala son necesarios'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);
        //enviar notificación de los clientes que se conectan
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSalas(data.sala));
        //aviso de cuando una persona se conecta
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('administrador', `${data.nombre} se unió`));
        //retorna las personas conectadas en el chat
        callback(usuarios.getPersonasPorSalas(data.sala));

    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id)

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);
    })

    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona(client.id);
        //indica que usuario abandona el chat
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('administrador', `${personaBorrada.nombre} salió`));
        //mustra la lista de los usuarios conectados
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSalas(personaBorrada.sala));
    });

    //mensajes privados

    client.on('mensajePrivado', data => {

        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    });



});