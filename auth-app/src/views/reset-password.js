import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ethf_img from '../ethf.png'

export default function ResetPassword(props) {
    const code = (new URL(window.location.href)).searchParams.get('code')
    const [codeSentTo, setCodeSentTo] = useState(null)
    const [passwordChangedTo, setPasswordChangedTo] = useState(null)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConf, setPasswordConf] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmitSendCode(e) {
        e.preventDefault()
        if (loading) return
        setErrorMessage()
        setLoading(true)
        try {
            await axios.post('/api/account/request-reset-password', { username, email })
            setCodeSentTo(email)
        } catch (error) {
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                setErrorMessage("No se puede resetear la contraseña de este usuario")
            } else {
                setErrorMessage("Error, intente otra vez")
            }
        }
        setLoading(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (loading) return
        setLoading(true)
        setErrorMessage()
        if (password != passwordConf) {
            setErrorMessage("Las contraseñas no coinciden")
            return
        }
        try {
            const response = await axios.post('/api/account/reset-password', { username, password }, {
                params: {
                    code
                }
            })
            setErrorMessage()
            setPasswordChangedTo(username)
        } catch (error) {
            let m = null;
            if (error.response && error.response.data) {
                console.log(error.response.data)
                m = error.response.data
            }
            if (m === 'bad_request') setErrorMessage('Revise el usuario ingresado')
            if (m === 'link_expired') setErrorMessage('Link incorrecto o ya expiró')
            if (m === 'insecure_password') setErrorMessage('La contraseña es insegura, elija una mejor')
            if (m === 'internal_error') setErrorMessage('Error del servidor')
            if (!m) setErrorMessage('Ocurrió un error. Reivse la conexión')
        }
        setLoading(false)
    }

    if (passwordChangedTo) {
        return <div>
            <img src={ethf_img} />
            <p>Se cambió la contraseña de {passwordChangedTo}</p>
            <Link to="/reset-password" onClick={() => setPasswordChangedTo()}>Volver</Link>
        </div>
    }

    if (code) {
        return <div>
            <img src={ethf_img} />
            <form onSubmit={handleSubmit}>
                {loading && <p className="message">Cargando... puede tardar un rato</p>}
                {errorMessage && <p className="error message">{errorMessage}</p>}
                <label className="floating-label" htmlFor="username">Nombre de usuario</label>
                <input type="text" name="username" id="username" value={username} onChange={e => setUsername(e.target.value)} />
                <label className="floating-label" htmlFor="password">Nueva contraseña</label>
                <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
                <label className="floating-label" htmlFor="password_conf">Confirmar contraseña</label>
                <input type="password" name="password_conf" id="password_conf" value={passwordConf} onChange={e => setPasswordConf(e.target.value)} />
                <input type="submit" value="Cambiar contraseña" disabled={loading} />
            </form>
        </div>
    }


    if (codeSentTo) {
        return <div>
            <img src={ethf_img} />
            <p>Un email con un link de recuperación se envió a {codeSentTo}</p>
            <a href="#!" onClick={() => setCodeSentTo(null)}>Volver</a>
        </div>
    }

    return <div>
        <img src={ethf_img} />
        <p>Recibirás un email con un link al cual tendrás que acceder para cambiar tu contraseña.</p>
        <form onSubmit={handleSubmitSendCode}>
            {errorMessage && <p className="error message">{errorMessage}</p>}
            <label className="floating-label" htmlFor="username">Nombre de usuario</label>
            <input type="text" name="username" id="username" value={username} onChange={e => setUsername(e.target.value)} />
            <label className="floating-label" htmlFor="email">Email</label>
            <input type="text" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="submit" value="Enviar email" disabled={loading} />
        </form>
    </div>
}




