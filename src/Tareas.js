const nodecron = require('node-cron')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Funciones

function IniciarTareas (client) {
    console.log('Iniciando tareas')
    // nodecron.schedule('0 8 * * *', async() => {
    nodecron.schedule('* * * * *', async() => {

       try {
        const citas = await prisma.citas.findMany({
            where: {
                confirmado: 0            
            },
            include: {
                clientes: true,
                horarios_disponibles: true
            }
        })

        for await ( const cita of citas ) {
            const { id, cliente_id, horarios_disponibles, clientes} = cita
           
            let getHour = Number(horarios_disponibles.hora.split(':')[0])
            let hora
            if( getHour < 12 ) {
                hora = `${getHour}:00 AM`
            }else {
                getHour - 12
                hora = `${getHour}:00 PM`
            }

            await client.sendMessage(cliente_id, 
                `Hola! ${clientes.nombre} tienes una cita el ${horarios_disponibles.dia_semana} a las ${hora}
                \n\nPara confirmar la cita escribe Confirmar
            `)
        }

        } catch (error) {
                console.log(error)
        }

        

    })
}

// Array de tareas

const tareas = [
    {
        id: 1,
        descripcion: 'Confirmar Cita',
        fecha: '2021-10-01',
        hora: '10:00',
        activa: true,
        cron: nodecron.schedule('0 10 * * *', () => {
            console.log('Tarea 1')
        })
    },
    {
        id: 2,
        descripcion: 'Tarea 2',
        fecha: '2021-10-02',
        hora: '11:00',
        activa: true,
        cron: nodecron.schedule('0 11 * * *', () => {
            console.log('Tarea 2')
        })
    },
    {
        id: 3,
        descripcion: 'Tarea 3',
        fecha: '2021-10-03',
        hora: '12:00',
        activa: true,
        cron: nodecron.schedule('0 12 * * *', () => {
            console.log('Tarea 3')
        })
    },
    {
        id: 4,
        descripcion: 'Tarea 4',
        fecha: '2021-10-04',
        hora: '13:00',
        activa: true,
        cron: nodecron.schedule('0 13 * * *', () => {
            console.log('Tarea 4')
        })
    },
    {
        id: 5,
        descripcion: 'Tarea 5',
        fecha: '2021-10-05',
        hora: '14:00',
        activa: true,
        cron: nodecron.schedule('0 14 * * *', () => {
            console.log('Tarea 5')
        })
    }
]

module.exports = {
    tareas,
    IniciarTareas
}