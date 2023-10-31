const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { PrismaClient } = require('@prisma/client')
const { IniciarTareas } = require('./src/Tareas')

const prisma = new PrismaClient()

const client = new Client({
    authStrategy: new LocalAuth()
});




client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
    IniciarTareas(client)
});

client.on('message', async msg => {

    const idCliente = msg.id.remote
    const getContact = await msg.getContact()
    const nombreCliente = getContact.pushname
    const numeroCliente = getContact.number


    const exist = await prisma.clientes.findUnique({
        where: {
            id: idCliente,
        }
    })

    if (!exist) {
        await prisma.clientes.create({
            data: {
                id: idCliente,
                nombre: nombreCliente,
                numero: numeroCliente
            }
        })

    }


    if (msg.body.match('/nataren|Emi|Emiliano|bot|buenos dias|Hola|menu|Menu/i')) {
        msg.reply(`Hola, en que puedo ayudarte? 
        \n1. Agendar cita
        \n2. Consultar cita
        \n3. Cancelar cita
        `);
        return
    }

    if (msg.body === '1') {
        msg.reply('Escriba el dia de la semana en que desea agendar la cita para ver los horarios disponibles\n\nEjemplo: Lunes');
        return
    }

    // Mostrar Horarios disponibles en la semana

    if (msg.body === 'Lunes' || msg.body === 'Martes' || msg.body === 'Miercoles' || msg.body === 'Jueves' || msg.body === 'Viernes' || msg.body === 'Sabado') {
        const horariosDisponibles = await prisma.horarios_disponibles.findMany({
            where: {
                dia_semana: msg.body
            }
        })

        const citas = await prisma.citas.findMany({
            include: {
                horarios_disponibles: true
            }
        })

        
        const horariosLibres = horariosDisponibles.filter(horario => {
            const fechaHorario = horario.hora;

            return citas.some(cita => {
                if(cita.fecha_cita !== horario.id){
                    return fechaHorario
                }
            })
        })

        const horariosComoCadena = horariosLibres.map((horario) => {

            return `- ${horario.hora.split(':')[0]}:00`
        }).join('\n')

        msg.reply(`Estos son los horarios disponibles para ${msg.body}:\n\n${horariosComoCadena}
            \n\nPara agendar una cita escriba:\n Agendar + Dia + Hora\n\nEjemplo: Agendar ${msg.body} 16 \n( Lunes 16:00 hrs )
        `);

        return
    }
 
    // Agendar cita
    if (msg.body.includes('Agendar') || msg.body.includes('agendar')) {

        //Yo
        const dia = msg.body.split(' ')[1]
        const hora = msg.body.split(' ')[2]

        try {
            const alreadyOnList = await prisma.citas.findFirst({
                where: {
                    cliente_id: idCliente
                }
            })

            if (alreadyOnList) {
                msg.reply('Ya tienes una cita agendada, si deseas cancelarla escribe Cancelar cita')
                return
            }



            const existDate = await prisma.horarios_disponibles.findFirst({
                where: {
                    dia_semana: dia,
                    hora: `${hora}:00:00`
                }
            })

            if (!existDate) {
                msg.reply('El dia o la hora que ingresaste no es valida, intente de nuevo')
                return
            }


            await prisma.citas.create({
                data: {
                    fecha_cita: existDate.id,
                    cliente_id: idCliente,

                }
            })

            msg.reply(`Su cita ha sido agendada para el dia ${dia} a las ${hora}:00`)
            return

        } catch (error) {
            console.log(error)
            msg.reply('Ocurrio un error, intente de nuevo')
        }
    }

    // Cancelar cita
    if (msg.body.includes('Cancelar') || msg.body.includes('cancelar')) {
        try {
            const alreadyOnList = await prisma.citas.findFirst({
                where: {
                    cliente_id: idCliente
                }
            })
            if (!alreadyOnList) {
                msg.reply('No tienes una cita agendada')
                return
            }



            await prisma.citas.delete({
                where: {
                    id: alreadyOnList.id
                }
            })

            msg.reply('Su cita ha sido cancelada')

        } catch (error) {
            console.log(error)
            msg.reply('Ocurrio un error, intente de nuevo')
        }
    }

    // Consultar cita

    if (msg.body.includes('Consultar') || msg.body.includes('consultar')) {
        try {
            const alreadyOnList = await prisma.citas.findFirst({
                where: {
                    cliente_id: idCliente
                }
            })
            if (!alreadyOnList) {
                msg.reply('No tienes una cita agendada')
                return
            }

            const fechaCita = await prisma.horarios_disponibles.findFirst({
                where: {
                    id: alreadyOnList.fecha_cita
                }
            })

            let hora = fechaCita.hora.split(':')[0]

            if (hora > 12) {
                hora = hora - 12
                hora = `${hora}:00 pm`
            } else {
                hora = `${hora}:00 am`
            }

            msg.reply(`Su cita esta agendada para el dia ${fechaCita.dia_semana} a las ${hora}`)

        } catch (error) {
            console.log(error)
            msg.reply('Ocurrio un error, intente de nuevo')
        }
    }
});

client.initialize();