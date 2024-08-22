const baseURL = "https://babytracker.develotion.com/";
const baseURLimg = "https://babytracker.develotion.com/imgs/";
const ruteo = document.querySelector("#ruteo");
const menu = document.querySelector("#menu");
let _categorias = [];
let _plazas = [];
//Mapa
navigator.geolocation.getCurrentPosition(guardarUbicacion, mostrarError);
let latitudDispositivo;
let longitudDispositivo;
window.addEventListener("load", inicio);

function inicio() {
  start();
}

function start() {
  ocultarVentanas();
  agregarEventos();
  if (
    localStorage.getItem("token") != null &&
    localStorage.getItem("token") == ""
  ) {
    //oculto
    ocultarElementos("menuLogin", "none");
    ocultarElementos("menuRegistro", "none");
    //muestro
    mostrarElementos("menuAgregarEvento", "inline");
    mostrarElementos("menuListarEventos", "inline");
    mostrarElementos("menuInformeEventos", "inline");
    mostrarElementos("menuLogout", "inline");
    mostrarElementos("menuMapa", "inline");
    precargarCategorias();
  } else {
    //oculto
    ocultarElementos("menuAgregarEvento", "none");
    ocultarElementos("menuListarEventos", "none");
    ocultarElementos("menuInformeEventos", "none");
    ocultarElementos("menuMapa", "none");
    ocultarElementos("menuLogout", "none");
    obtenerDepartamentos();
  }
}

async function precargarCategorias() {
  _categorias = await obtenerCategoriasParaListar();
}

async function obtenerCategoriasParaListar() {
  let token = localStorage.getItem("token");
  let idUser = localStorage.getItem("iduser");
  let requestOptions = {
    method: "Get",
    headers: {
      "Content-Type": "Application/json",
      apikey: token,
      iduser: idUser,
    },
  };

  return fetch(baseURL + "categorias.php", requestOptions)
    .then((response) => response.json())
    .then(function (datos) {
      return datos.categorias;
    })
    .catch(function (error) {
      mostrarMensaje(error.message);
    });
}

function guardarUbicacion(position) {
  latitudDispositivo = position.coords.latitude;
  longitudDispositivo = position.coords.longitude;
}

function mostrarError(error) {
  switch (error.code) {
    case 1:
      mostrarMensaje("El usuario no habilitó la ubicaión");
      break;
    case 2:
      mostrarMensaje("Ubicación no disponible");
      break;
    case 3:
      mostrarMensaje("Expiró el tiempo para poder obtener la ubicación");
      break;
  }
}

function dibujarMapa() {
  var greenIcon = L.icon({
    iconUrl: 'leaf-green.png',
    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62], // the same for the shadow
    popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
  });
  var map = L.map("map").setView([latitudDispositivo, longitudDispositivo], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.marker([latitudDispositivo, longitudDispositivo])
    .addTo(map)
    .bindPopup("Estoy aquí")
    .openPopup();
  _plazas.forEach((plaza) => {
    let accesible = "No";
    let aceptaMascotas = "No";
    if(plaza.accesible==1){
      accesible = "Si";
    }
    if(plaza.aceptaMascotas == 1){
      aceptaMascotas = "Si";
    }
    L.marker([plaza.latitud, plaza.longitud], { icon: greenIcon })
      .addTo(map)
      .bindPopup("Es Accesible: "+ accesible+ "<br> Acepta Mascotas: "+ aceptaMascotas);
  });
}

function obtenerPlazas() {
  let apiKey = localStorage.getItem("token");
  let iduser = localStorage.getItem("iduser");
  let requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      iduser: iduser,
    },
  };
  fetch(baseURL + "plazas.php", requestOptions)
    .then(function (response) {
      if (response.status == 200) {
        return response.json();
      } else if (response.status == 404) {
        mostrarMensaje("DIrección no encontrada");
      } else {
        mostrarMensaje("Debe iniciar sesion");
      }
    })
    .then(function (data) {
      data.plazas.forEach((element) => {
        _plazas.push(element);
      });
    })
    .catch(function (error) {
      mostrarMensaje(error.message);
    });
}

function altaEvento() {
  let categoria = document.querySelector("#slcCategoria").value;
  let fecha = document.querySelector("#dateTimeAltaEvento").value;
  let detalle = document.querySelector("#txtDetalles").value;
  let idUsuario = localStorage.getItem("iduser");
  //VALIDAMOS QUE LA FECHA SEA DE TIPO  DATE
  if (!fecha) {
    fecha = new Date();
  }
  if (!categoria) {
    categoria = "";
  }
  let evento = {
    idCategoria: categoria,
    idUsuario: idUsuario,
    detalle: detalle,
    fecha: fecha,
  };
  try {
    validarDatosAltaEvento(categoria, fecha);
    registrarEventoEnApi(evento);
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

function registrarEventoEnApi(elEvento) {
  let token = localStorage.getItem("token");
  let idUser = elEvento.idUsuario;
  let requestOptions = {
    method: "Post",
    headers: {
      "Content-Type": "application/json",
      apikey: token,
      iduser: idUser,
    },
    body: JSON.stringify(elEvento),
  };
  fetch(baseURL + "eventos.php", requestOptions)
    .then(function (response) {
      if (response.status == 200) {
        return response.json();
      } else if (response.status == 404) {
        mostrarMensaje("DIrección no encontrada");
      } else {
        mostrarMensaje("Debe iniciar sesion");
      }
    })
    .then(function (datos) {
      mostrarMensaje(datos.mensaje);
    })
    .catch(function (error) {
      mostrarMensaje(error.message);
    });
}

function validarDatosAltaEvento(categoria, fecha) {
  let fechaHoy = new Date();
  fecha = new Date(fecha);
  if (categoria.trim().length == 0) {
    throw new Error("Categoria obligatoria");
  }
  if (fechaHoy.getTime() < fecha.getTime()) {
    throw new Error("La fecha no puede ser mayor a la actual");
  }
}

function obtenerDepartamentos() {
  let requestOptions = {
    method: "Get",
    headers: {
      "Content-type": "application/json",
    },
  };
  fetch(baseURL + "departamentos.php", requestOptions)
    .then(function (response) {
      if (response.status == 404) {
        mostrarMensaje("No se encontraron los departamentos");
      } else {
        return response.json();
      }
    })
    .then(function (data) {
      let departamentos = "";
      data.departamentos.forEach((element) => {
        departamentos += `<ion-select-option value="${element.id}">${element.nombre}</ion-select-option>`;
      });
      document.querySelector("#slcDepartamentos").innerHTML = departamentos;
    })
    .catch(function (error) {
      mostrarMensaje(error.message);
    });
}

function obtenerCategorias() {
  let token = localStorage.getItem("token");
  let idUser = localStorage.getItem("iduser");

  let requestOptions = {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      apikey: token,
      iduser: idUser,
    },
  };

  fetch(baseURL + "categorias.php", requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let categorias = "";
      if (data.codigo == 401) {
        mostrarMensaje(data.mensaje);
      } else {
        data.categorias.forEach((element) => {
          categorias += `<ion-select-option value="${element.id}">${element.tipo}</ion-select-option>`;
        });
      }
      document.querySelector("#slcCategoria").innerHTML = categorias;
    })
    .catch(function (error) {
      mostrarMensaje(error.message);
    });
}

function obtenerCiudades(event) {
  console.log(event.detail.value);
  let idD = event.detail.value;
  let requestOptions = {
    method: "GET",
    headers: { "Content-type": "application/json" },
  };

  fetch(baseURL + "ciudades.php?idDepartamento=" + idD, requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let ciudades = "";
      if (data.ciudades.lenght != 0) {
        data.ciudades.forEach((element) => {
          ciudades += `<ion-select-option value="${element.id}">${element.nombre}</ion-select-option> `;
          document.querySelector("#slcCiudades").innerHTML = ciudades;
        });
      } else {
        mostrarMensaje("No hay ciudades asociadas.");
      }
    })
    .catch(function (error) {
      mostrarMensaje("Error en la comunicación");
    });
}

function ocultarElementos(id) {
  document.getElementById(id).style.display = "none";
}

function ocultarVentanas() {
  let ventanas = document.querySelectorAll(".ion-page");
  for (let i = 1; i < ventanas.length; i++) {
    ventanas[i].style.display = "none";
  }
}

function agregarEventos() {
  document.querySelector("#btnIniciarSesion").addEventListener("click", login);
  document.querySelector("#btnRegistrar").addEventListener("click", registro);
  document
    .querySelector("#btnAltaEvento")
    .addEventListener("click", altaEvento);
  document
    .querySelector("#slcDepartamentos")
    .addEventListener("ionChange", obtenerCiudades);
  ruteo.addEventListener("ionRouteWillChange", mostrarPagina);
  //ALTA EVENTO
  document
    .querySelector("#btnAltaEvento")
    .addEventListener("click", altaEvento);
  document
    .querySelector("#menuListarEventos")
    .addEventListener("click", listarEventos);
  //Informe de Eventos
  document
    .querySelector("#menuInformeEventos")
    .addEventListener("click", informeEventos);
}

function informeEventos() {
  let eventosBiberon = "";
  let eventosPaniales = "";
  let _biberonesDeHoy = [];
  let _panialesDeHoy = [];
  let tiempoTranscurridoUltimoBiberon = 0;
  let tiempoTranscurridoUltimoPanial = 0;
  let fechaHoy = new Date();

  let token = localStorage.getItem("token");
  let idUser = localStorage.getItem("iduser");

  let requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: token,
      iduser: idUser,
    },
  };
  fetch(baseURL + "eventos.php?idUsuario=" + idUser, requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      data.eventos.forEach((evento) => {
        let fechaEvento = new Date(evento.fecha);
        //idCateoria 35 corresponde a Biberones
        if (fechaEvento.toDateString() === fechaHoy.toDateString()) {
          if (evento.idCategoria == 35) {
            _biberonesDeHoy.push(evento);
          }
          //idCateoria 33 corresponde a Pañales
          if (evento.idCategoria == 33) {
            _panialesDeHoy.push(evento);
          }
        }
      });
      //Calculo tiempo del último biberon
      if (!_biberonesDeHoy.length - 1) {
        let fechaUltBib = new Date(
          _biberonesDeHoy[_biberonesDeHoy.length - 1].fecha
        );
        tiempoTranscurridoUltimoBiberon =
          ((fechaHoy.getTime() - fechaUltBib.getTime()) / 60000).toFixed(2) +
          "minutos";
      }
      if (!_panialesDeHoy.length - 1) {
        let fechaUltPanial = new Date(
          _panialesDeHoy[_panialesDeHoy.length - 1].fecha
        );
        tiempoTranscurridoUltimoPanial =
          ((fechaHoy.getTime() - fechaUltPanial.getTime()) / 60000).toFixed(2) +
          "minutos";
      }
      //Armo la tarjeta con el total de biberones y el anterior
      eventosBiberon = `<ion-card>
                        <ion-card-header>
                          <ion-card-title>Ingeridos</ion-card-title>
                          <ion-card-subtitle>${fechaHoy.toLocaleDateString()}</ion-card-subtitle>
                        </ion-card-header>
                        <ion-card-content>
                          <ion-list>
                            <ion-item>
                              <ion-thumbnail slot="start">
                                <img alt="Silhouette of mountains" src="${baseURLimg}5.png" />
                              </ion-thumbnail>
                              <ion-label>Total: ${
                                _biberonesDeHoy.length
                              }</ion-label>
                              <ion-label>Anterior hace: ${tiempoTranscurridoUltimoBiberon}</ion-label>
                            </ion-item>
                        </ion-card>`;

      eventosPaniales = `<ion-card>
                            <ion-card-header>
                              <ion-card-title>Cambiados</ion-card-title>
                              <ion-card-subtitle>${fechaHoy.toLocaleDateString()}</ion-card-subtitle>
                            </ion-card-header>
                            <ion-card-content>
                            <ion-list>
                             <ion-item>
                               <ion-thumbnail slot="start">
                                 <img alt="Silhouette of mountains" src="${baseURLimg}3.png" />
                               </ion-thumbnail>
                               <ion-label>Total: ${
                                 _panialesDeHoy.length
                               }</ion-label>
                               <ion-label>Anterior hace: ${tiempoTranscurridoUltimoPanial}</ion-label>
                            </ion-item>
                          </ion-card>`;

      document.querySelector("#idBiberones").innerHTML = eventosBiberon;
      document.querySelector("#idPaniales").innerHTML = eventosPaniales;
    })
    .catch(function (error) {
      mostrarMensaje(error.message);
    });
}

function listarEventos() {
  let token = localStorage.getItem("token");
  let idUser = localStorage.getItem("iduser");

  let requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: token,
      iduser: idUser,
    },
  };

  fetch(baseURL + "eventos.php?idUsuario=" + idUser, requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      let eventosDia = "";
      let eventosAnteriores = "";
      let fechaHoy = new Date();

      data.eventos.forEach((element) => {
        let fechaElemento = new Date(element.fecha);
        let categoria = _categorias.find((c) => c.id == element.idCategoria);
        if (fechaElemento.toDateString() === fechaHoy.toDateString()) {
          eventosDia += `<ion-card>
                  <img alt="Silhouette of mountains" src="${baseURLimg}${categoria.imagen}.png"/>
                  <ion-card-header>
                    <ion-card-title>${categoria.tipo}</ion-card-title>
                    <ion-card-subtitle>${element.detalle}</ion-card-subtitle>
                  </ion-card-header>
                  <ion-card-content>
                  </ion-card-content>
                  <ion-button fill="clear" onclick="eliminar(${element.id})">Eliminar</ion-button>
                </ion-card>`;
        } else {
          eventosAnteriores += `<ion-card>
                  <img alt="Silhouette of mountains" src="${baseURLimg}${categoria.imagen}.png"/>
                  <ion-card-header>
                    <ion-card-title>${categoria.tipo}</ion-card-title>
                    <ion-card-subtitle>${element.detalle}</ion-card-subtitle>
                  </ion-card-header>
                  <ion-card-content>
                  </ion-card-content>
                  <ion-button fill="clear" onclick="eliminar(${element.id})">Eliminar</ion-button>
                </ion-card>`;
        }
      });
      document.querySelector("#eventosDelDia").innerHTML = eventosDia;
      document.querySelector("#eventosAnteriores").innerHTML =
        eventosAnteriores;
    })
    .catch(function (error) {
      mostrarMensaje("Error en la comunicación");
    });
}

function eliminar(idEvento) {
  let token = localStorage.getItem("token");
  let idUser = localStorage.getItem("iduser");

  let requestOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      apikey: token,
      iduser: idUser,
    },
    params: idEvento,
  };

  fetch(baseURL + "eventos.php?idEvento=" + idEvento, requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.response != 401 && data.response != 404) {
        mostrarMensaje(data.mensaje);
      }
    })
    .catch(function (error) {
      mostrarMensaje("Error en la comunicación");
    });
  //llamo a listar nuevamente para que refresque
  //TODO: no esta haciendo el efecto de refrescar.
  setTimeout(() => {
    listarEventos();
  }, 1000);
}

function login() {
  //tomo datos
  let usuario = document.querySelector("#txtUsuario").value;
  let password = document.querySelector("#txtPassword").value;

  validarDatosLogin(usuario, password);

  //Chequeo contra la API si el usuario existe.
  let userData = {
    usuario: usuario,
    password: password,
  };

  let requestOptions = {
    method: "Post",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(userData),
  };

  fetch(baseURL + "login.php", requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.codigo == 409) {
        mostrarMensaje(data.mensaje);
      } else {
        mostrarMensaje("Login exitoso");
        localStorage.setItem("token", data.apiKey);
        localStorage.setItem("iduser", data.id);
        precargarCategorias();
        ocultarElementos("menuLogin");
        ocultarElementos("menuRegistro");
        mostrarElementos("menuLogout");
        mostrarElementos("menuAgregarEvento", "inline");
        mostrarElementos("menuListarEventos", "inline");
        mostrarElementos("menuInformeEventos", "inline");
        mostrarElementos("menuMapa", "inline");
        mostrarElementos("menuLogout", "inline");
        ruteo.push("/ListarEventos");
        listarEventos();
        obtenerPlazas();
        setTimeout(() => {
          dibujarMapa();
        }, 2200);
      }
    })
    .catch(function (error) {
      mostrarMensaje("Error en la comunicación");
    });
}

function validarDatosLogin(usuario, password) {
  if (usuario.trim().length == 0) {
    throw new Error("El usuario es obligatorio");
  }
  //TODO: acomodar a 8 despues de probar
  if (password.trim().length < 1) {
    throw new Error(
      "La contraseña debe tener un largo mayor o igual a 8 caracteres"
    );
  }
}

function registro() {
  try {
    let nombre = document.querySelector("#txtUsuarioRegistro").value;
    let password = document.querySelector("#txtContraseniaRegistro").value;
    let departamento = document.querySelector("#slcDepartamentos").value;
    let ciudad = document.querySelector("#slcCiudades").value;

    validarDatosRegistro(nombre, password, departamento, ciudad);

    let usuario = {
      usuario: nombre,
      password: password,
      idDepartamento: departamento,
      idCiudad: ciudad,
    };
    registroEnApi(usuario);
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

function registroEnApi(usuario) {
  fetch(baseURL + "/usuarios.php", {
    method: "Post",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(usuario),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (datos) {
      if (datos.codigo == 200) {
        ocultarElementos("menuRegistro");
        document.querySelector("#formRegistro").reset();
        mostrarMensaje("Registro exitoso");
        setTimeout(() => {
          ruteo.push("/Login");
        }, 2200);
      } else {
        mostrarMensaje(datos.mensaje);
      }
    })
    .catch(function (error) {
      mostrarMensaje("Error en la comunicación");
    });
}

function validarDatosRegistro(nombre, password, idDepartamento, idCiudad) {
  if (nombre.trim().length == 0) {
    throw new Error("El usuario es obligatorio");
  }
  //TODO: acomodar a 8 despues de probar
  if (password.trim().length < 1) {
    throw new Error(
      "La contraseña debe tener un largo mayor o igual a 8 caracteres"
    );
  }
  if (idDepartamento.trim().length == 0 || idDepartamento == null) {
    throw new Error("Departamento incorrecto!");
  }
  if (idCiudad.trim().length == 0 || idCiudad == null) {
    throw new Error("Ciudad incorrecta!");
  }
}

function mostrarPagina(evt) {
  let rutaDestino = evt.detail.to;
  ocultarVentanas();
  switch (rutaDestino) {
    case "/":
      mostrarElementos("inicio", "block");
      break;
    case "/AgregarEvento":
      mostrarElementos("agregarEvento", "block");
      break;
    case "/ListarEventos":
      mostrarElementos("listarEventos", "block");
      break;
    case "/InformeEventos":
      mostrarElementos("informeEventos", "block");
      break;
    case "/Login":
      mostrarElementos("login", "block");
      break;
    case "/MostrarMapa":
      mostrarElementos("mostrarMapa", "block");
      break;
    case "/Logout":
      ocultarElementos("menuLogout");
      mostrarElementos("menuLogin", "inline");
      mostrarElementos("menuRegistro", "inline");
      ocultarElementos("menuAgregarEvento");
      ocultarElementos("menuListarEventos");
      ocultarElementos("menuInformeEventos");
      ocultarElementos("mostrarMapa");
      localStorage.clear();
      ruteo.push("/Login");
      break;
    case "/Registro":
      mostrarElementos("registro", "block");
  }
}

function mostrarElementos(id, display) {
  document.getElementById(id).style.display = display;
}

function mostrarMensaje(texto) {
  let toast = document.createElement("ion-toast");
  toast.duration = 2000;
  toast.message = texto;
  toast.position = "bottom";
  toast.present();
  document.body.appendChild(toast);
}

function cerrarMenu() {
  menu.close();
}
