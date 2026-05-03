{
  "meta": {
    "product_name": "Sistema de Gestión de Clases",
    "ui_language": "es-ES",
    "app_type": "dashboard interno (staff)",
    "responsive_target": "Fluido en desktop y tablet (>=768px). Mobile no prioritario pero no debe romper.",
    "design_personality": [
      "Profesional y sereno (operación diaria)",
      "Alta legibilidad en tablas",
      "Densidad controlada (mucho aire, pero eficiente)",
      "Señalización clara de estados (asistencia/facturación/conflictos)",
      "Sin look ‘startup flashy’; más ‘administración premium’"
    ],
    "inspiration_notes": {
      "layout_fusion": "Estructura tipo Horizon UI / admin SaaS (sidebar fijo + topbar utilitaria) + detalle tipo CRM (tabs, badges, filtros) + micro-interacciones suaves estilo shadcn.",
      "references": [
        "https://dribbble.com/search/school-admin",
        "https://dribbble.com/search/attendance-management-dashboard",
        "https://www.figma.com/community/file/1219642652767985298/school-management-admin-dashboard-ui",
        "https://shadcnstudio.com/blog/shadcn-sidebar-examples"
      ]
    }
  },

  "brand_tokens": {
    "fonts": {
      "heading": {
        "family": "Space Grotesk",
        "google_fonts_import": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
        "usage": "H1/H2, títulos de cards, encabezados de tablas"
      },
      "body": {
        "family": "Work Sans",
        "google_fonts_import": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap",
        "usage": "Texto general, labels, formularios, tablas"
      },
      "mono": {
        "family": "Roboto Mono",
        "google_fonts_import": "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap",
        "usage": "IDs, códigos de factura, referencias cortas"
      }
    },

    "typography_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-lg md:text-xl font-semibold",
      "card_title": "text-sm font-semibold",
      "body": "text-sm md:text-base",
      "small": "text-xs text-muted-foreground"
    },

    "radius_shadow_spacing": {
      "radius": {
        "base": "--radius: 0.75rem;",
        "card": "rounded-xl",
        "button": "rounded-lg",
        "input": "rounded-lg"
      },
      "shadows": {
        "card": "shadow-[0_1px_0_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]",
        "popover": "shadow-[0_12px_40px_rgba(16,24,40,0.12)]",
        "focus_ring": "ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-[hsl(var(--background))]"
      },
      "spacing_rules": [
        "Usar 2–3x más espacio del ‘mínimo’: cards con p-5/p-6; secciones con gap-6.",
        "Tablas: densidad media (py-3 en celdas), filtros en una barra superior con gap-2/gap-3.",
        "Evitar contenedores centrados globalmente; el contenido debe alinearse a la izquierda con max-w controlado solo en vistas de detalle."
      ]
    },

    "color_system": {
      "intent": "Base neutra cálida + acento teal oceánico + estados claros (éxito/alerta/error) sin gradientes saturados.",
      "palette_hex": {
        "bg": "#F7F8FA",
        "surface": "#FFFFFF",
        "surface_2": "#F1F4F7",
        "text": "#0F172A",
        "text_muted": "#475569",
        "border": "#E2E8F0",
        "primary_teal": "#0F766E",
        "primary_teal_hover": "#115E59",
        "accent_mint": "#99F6E4",
        "info_blue": "#2563EB",
        "success": "#16A34A",
        "warning": "#D97706",
        "danger": "#DC2626",
        "conflict": "#B45309"
      },
      "shadcn_hsl_tokens_to_set_in_index_css": {
        "background": "210 20% 98%",
        "foreground": "222 47% 11%",
        "card": "0 0% 100%",
        "card-foreground": "222 47% 11%",
        "popover": "0 0% 100%",
        "popover-foreground": "222 47% 11%",
        "primary": "173 80% 26%",
        "primary-foreground": "0 0% 100%",
        "secondary": "210 25% 96%",
        "secondary-foreground": "222 47% 11%",
        "muted": "210 25% 96%",
        "muted-foreground": "215 16% 35%",
        "accent": "173 55% 92%",
        "accent-foreground": "173 80% 18%",
        "destructive": "0 72% 51%",
        "destructive-foreground": "0 0% 100%",
        "border": "214 20% 90%",
        "input": "214 20% 90%",
        "ring": "173 80% 26%",
        "chart-1": "173 80% 26%",
        "chart-2": "221 83% 53%",
        "chart-3": "27 96% 61%",
        "chart-4": "142 71% 45%",
        "chart-5": "0 72% 51%",
        "radius": "0.75rem"
      },
      "allowed_gradients": {
        "rule": "Solo fondos decorativos (<=20% viewport), nunca en áreas de lectura ni elementos pequeños.",
        "hero_top_strip": "bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(13,148,136,0.14),transparent_55%),radial-gradient(900px_circle_at_90%_10%,rgba(37,99,235,0.10),transparent_50%)]",
        "sidebar_accent_strip": "bg-[linear-gradient(180deg,rgba(13,148,136,0.18),transparent_70%)]"
      },
      "texture": {
        "noise_overlay_css": ".noise::before{content:'';position:absolute;inset:0;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.08%22/%3E%3C/svg%3E');mix-blend-mode:multiply;pointer-events:none;border-radius:inherit;}"
      }
    }
  },

  "layout_system": {
    "global_shell": {
      "structure": "Sidebar fijo (desktop) + Topbar + área principal con scroll. En tablet (>=768) sidebar colapsable con Sheet.",
      "grid": {
        "page_container": "max-w-[1400px] mx-auto px-4 md:px-6",
        "dashboard_grid": "grid grid-cols-12 gap-4 md:gap-6",
        "cards_row": "col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6",
        "main_two_col": "col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6"
      },
      "sidebar": {
        "width": "w-[280px]",
        "style": "bg-white border-r border-border",
        "nav_item": "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground",
        "nav_item_active": "bg-accent text-accent-foreground font-medium",
        "group_label": "px-3 pt-5 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      },
      "topbar": {
        "height": "h-14",
        "style": "sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border",
        "content": "Izquierda: breadcrumb + título. Derecha: búsqueda global (Command), selector rápido (Próximas clases), perfil/rol."
      }
    },

    "page_patterns": {
      "list_page": {
        "header": "Título + subtítulo (H2) + acciones (Nuevo, Exportar) + filtros.",
        "filters_bar": "Card compacta con inputs/selects + botón ‘Limpiar’ + contador de resultados.",
        "table": "Tabla shadcn con header sticky opcional, paginación abajo, skeleton en carga."
      },
      "detail_page": {
        "header": "Título + badges de estado + acciones contextualizadas.",
        "body": "Dos columnas en desktop: izquierda info principal, derecha panel lateral (resumen/acciones). En tablet: una columna con secciones apiladas.",
        "tabs": "Usar Tabs shadcn para Información / Clases / Asistencia / Facturación."
      },
      "crud_modal": {
        "pattern": "Dialog (desktop) / Drawer (tablet) con Form (react-hook-form + zod). Footer con Cancelar/Guardar."
      }
    }
  },

  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "alert_dialog": "/app/frontend/src/components/ui/alert-dialog.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "command": "/app/frontend/src/components/ui/command.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "popover": "/app/frontend/src/components/ui/popover.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sonner": "/app/frontend/src/components/ui/sonner.jsx",
      "pagination": "/app/frontend/src/components/ui/pagination.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "checkbox": "/app/frontend/src/components/ui/checkbox.jsx"
    },

    "buttons": {
      "variants": {
        "primary": {
          "intent": "Acción principal (Guardar, Registrar asistencia, Crear)",
          "classes": "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary))]/90 shadow-sm",
          "motion": "transition-colors duration-150 active:scale-[0.98]"
        },
        "secondary": {
          "intent": "Acción secundaria (Exportar, Ver detalle)",
          "classes": "bg-secondary text-secondary-foreground hover:bg-secondary/70",
          "motion": "transition-colors duration-150 active:scale-[0.98]"
        },
        "ghost": {
          "intent": "Acciones en tablas (Editar, Ver)",
          "classes": "hover:bg-accent hover:text-accent-foreground",
          "motion": "transition-colors duration-150"
        },
        "destructive": {
          "intent": "Eliminar",
          "classes": "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          "motion": "transition-colors duration-150 active:scale-[0.98]"
        }
      },
      "sizes": {
        "sm": "h-8 px-3 text-xs",
        "md": "h-9 px-4 text-sm",
        "lg": "h-10 px-5 text-sm"
      }
    },

    "badges": {
      "status_badges": {
        "facturacion": {
          "Pagada": "bg-emerald-50 text-emerald-700 border border-emerald-200",
          "Pendiente": "bg-amber-50 text-amber-700 border border-amber-200",
          "Vencida": "bg-rose-50 text-rose-700 border border-rose-200"
        },
        "asistencia": {
          "Presente": "bg-emerald-50 text-emerald-700 border border-emerald-200",
          "Ausente": "bg-slate-50 text-slate-700 border border-slate-200",
          "Tarde": "bg-amber-50 text-amber-700 border border-amber-200"
        },
        "conflicto_horario": {
          "Conflicto": "bg-orange-50 text-orange-800 border border-orange-200"
        }
      }
    },

    "tables": {
      "density": "Por defecto: filas cómodas (py-3). Para listas largas (Alumnos/Facturación) permitir modo compacto (py-2) con Switch.",
      "header": "Encabezado con fondo surface_2 y texto muted; opcional sticky top bajo topbar.",
      "row_hover": "hover:bg-secondary/60",
      "empty_state": "Card con icono lucide + texto + CTA para crear/limpiar filtros.",
      "loading": "Skeleton rows (8–12) + shimmer suave."
    },

    "forms": {
      "pattern": "Form shadcn + react-hook-form + zod. Labels arriba, helper text debajo. Errores en rojo con icono.",
      "input_classes": "bg-white",
      "validation_copy_es": {
        "required": "Este campo es obligatorio.",
        "email": "Ingresa un correo válido.",
        "min": "Debe tener al menos {n} caracteres."
      }
    },

    "navigation": {
      "sidebar_groups": [
        {
          "label": "Operación",
          "items": ["Dashboard", "Clases", "Próximas clases", "Salones", "Alumnos", "Asistencia", "Facturación"]
        },
        {
          "label": "Configuración",
          "items": ["Profesores", "Tipos de clase", "Usuarios del sistema (solo SUPERUSER)"]
        }
      ],
      "role_visibility": {
        "ADMIN": ["Dashboard", "Clases", "Próximas clases", "Salones", "Alumnos", "Asistencia", "Facturación", "Profesores", "Tipos de clase"],
        "SUPERUSER": "Todo + Usuarios del sistema + acciones avanzadas (Eliminar masivo, Exportar completo, Cambiar estados)"
      }
    }
  },

  "page_blueprints": {
    "login": {
      "layout": "Split-screen suave (>=1024): izquierda formulario, derecha panel decorativo con textura/noise y mini lista de ‘tips’. En tablet: una columna.",
      "copy_es": {
        "title": "Acceso al sistema",
        "subtitle": "Gestiona clases, asistencia y facturación de forma centralizada.",
        "email": "Correo",
        "password": "Contraseña",
        "submit": "Iniciar sesión",
        "loading": "Verificando credenciales…"
      },
      "components": ["Card", "Form", "Input", "Button", "Sonner"],
      "testids": {
        "email": "login-email-input",
        "password": "login-password-input",
        "submit": "login-submit-button",
        "error": "login-error-text"
      }
    },

    "dashboard": {
      "above_fold": "Fila de 3 cards KPI + panel ‘Clases de hoy’ (tabla compacta) + mini gráfico (Recharts) de asistencia semanal.",
      "kpis": [
        {"label": "Clases activas", "testid": "kpi-active-classes"},
        {"label": "Alumnos activos", "testid": "kpi-active-students"},
        {"label": "Clases hoy", "testid": "kpi-today-classes"}
      ],
      "today_schedule": {
        "pattern": "Tabla con hora, clase, salón, profesor, cupos, estado. Badge para ‘En curso’/‘Próxima’.",
        "testid": "dashboard-today-classes-table"
      },
      "chart": {
        "library": "recharts",
        "chart_type": "AreaChart suave",
        "style": "Área teal con opacidad 0.18, línea teal sólida, grid muy tenue.",
        "testid": "dashboard-attendance-week-chart"
      }
    },

    "clases": {
      "list": {
        "filters": ["Tipo", "Profesor", "Día", "Estado", "Buscar"],
        "primary_action": "Nueva clase",
        "table_columns": ["Nombre", "Tipo", "Profesor", "Días", "Horario", "Salón", "Cupos", "Estado", "Acciones"],
        "testids": {
          "create": "classes-create-button",
          "filters": "classes-filters-bar",
          "table": "classes-table"
        }
      },
      "detail": {
        "sections": ["Resumen", "Alumnos inscritos", "Horarios", "Historial de asistencia"],
        "enrolled_students_table_testid": "class-detail-enrolled-students-table"
      }
    },

    "salones": {
      "list": {
        "table_columns": ["Nombre", "Capacidad", "Ubicación", "Estado", "Acciones"],
        "testid": "classrooms-table"
      },
      "schedule_view": {
        "pattern": "Vista por día con Calendar + lista de bloques horarios. Conflictos resaltados con badge ‘Conflicto’.",
        "components": ["Calendar", "Popover", "Badge", "Card"],
        "testids": {
          "date": "classroom-schedule-date",
          "conflict": "classroom-schedule-conflict-indicator"
        }
      }
    },

    "alumnos": {
      "list": {
        "search": "Búsqueda por nombre, documento o teléfono.",
        "table_columns": ["Alumno", "Contacto", "Clases", "Estado", "Saldo", "Acciones"],
        "testid": "students-table"
      },
      "detail": {
        "tabs": ["Información", "Clases", "Asistencia", "Facturación"],
        "testid": "student-detail-tabs"
      }
    },

    "asistencia": {
      "flow": [
        "1) Seleccionar clase",
        "2) Seleccionar horario/fecha",
        "3) Grid de alumnos con toggle Presente/Ausente + nota",
        "4) Guardar"
      ],
      "grid": {
        "pattern": "Lista tipo tabla con Avatar + nombre + estado (Switch/ToggleGroup) + Textarea mini para notas.",
        "bulk_actions": "Marcar todos presentes / limpiar",
        "testids": {
          "class_select": "attendance-class-select",
          "schedule_select": "attendance-schedule-select",
          "student_grid": "attendance-student-grid",
          "save": "attendance-save-button"
        }
      }
    },

    "facturacion": {
      "list": {
        "filters": ["Estado", "Rango de fechas", "Alumno", "Método"],
        "table_columns": ["Factura", "Alumno", "Concepto", "Monto", "Vence", "Estado", "Acciones"],
        "testid": "billing-table"
      }
    },

    "profesores": {
      "list": {
        "table_columns": ["Profesor", "Contacto", "Especialidad", "Estado", "Acciones"],
        "testid": "teachers-table"
      }
    },

    "tipos_de_clase": {
      "list": {
        "table_columns": ["Tipo", "Duración", "Precio base", "Estado", "Acciones"],
        "testid": "class-types-table"
      }
    },

    "usuarios": {
      "visibility": "Solo SUPERUSER",
      "list": {
        "table_columns": ["Usuario", "Correo", "Rol", "Estado", "Acciones"],
        "testid": "system-users-table"
      }
    }
  },

  "motion_microinteractions": {
    "principles": [
      "Micro-animaciones cortas (120–180ms) para hover/focus.",
      "Nada de transition: all.",
      "Entrada de secciones con fade+slide sutil (Framer Motion opcional).",
      "Estados de carga: skeleton + botones con spinner."
    ],
    "recommended_library": {
      "name": "framer-motion",
      "install": "npm i framer-motion",
      "usage": "Animar aparición de cards y cambios de tabs sin marear. Respetar prefers-reduced-motion."
    },
    "examples": {
      "card_hover": "hover:shadow-[0_1px_0_rgba(16,24,40,0.04),0_14px_34px_rgba(16,24,40,0.10)] transition-shadow duration-200",
      "nav_active_indicator": "Barra izquierda 2px teal en item activo (pseudo-elemento o border-l-2 border-primary).",
      "table_row": "hover:bg-secondary/60 transition-colors duration-150"
    }
  },

  "data_visualization": {
    "recharts_guidance": {
      "theme": {
        "grid": "stroke: hsl(var(--border)) con opacity 0.35",
        "axis": "stroke: hsl(var(--muted-foreground))",
        "primary_series": "stroke: hsl(var(--primary)); fill: hsl(var(--primary)) con opacity 0.18"
      },
      "empty_state": "Si no hay datos: mostrar Card con texto ‘Aún no hay registros para este período’.",
      "testids": ["chart-container", "chart-empty-state"]
    }
  },

  "accessibility": {
    "requirements": [
      "Contraste AA mínimo en texto y badges.",
      "Focus visible siempre (ring con --ring teal).",
      "Targets táctiles >= 40px en tablet.",
      "Soporte teclado en tablas (acciones en DropdownMenu).",
      "Respetar prefers-reduced-motion (desactivar animaciones de entrada)."
    ],
    "aria_copy_es": {
      "open_menu": "Abrir menú",
      "close": "Cerrar",
      "loading": "Cargando"
    }
  },

  "testing_attributes": {
    "rule": "Todo elemento interactivo y toda info crítica debe incluir data-testid en kebab-case.",
    "examples": [
      "data-testid=\"sidebar-nav-dashboard\"",
      "data-testid=\"classes-table-row-actions\"",
      "data-testid=\"billing-status-badge\"",
      "data-testid=\"attendance-student-present-toggle\"",
      "data-testid=\"confirm-delete-dialog-confirm-button\""
    ]
  },

  "image_urls": {
    "login_side_panel": [
      {
        "url": "https://images.unsplash.com/photo-1599104040457-fe0e8c9ae77e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzY2hvb2wlMjBhZG1pbmlzdHJhdGlvbiUyMG9mZmljZSUyMHN0YWZmJTIwZGFzaGJvYXJkJTIwYWJzdHJhY3QlMjB0ZXh0dXJlfGVufDB8fHx0ZWFsfDE3NzcyMjEyNDd8MA&ixlib=rb-4.1.0&q=85",
        "description": "Textura arquitectónica azul/teal para panel decorativo del login (con overlay blanco + noise).",
        "category": "login"
      }
    ],
    "empty_states_optional": [
      {
        "url": "https://images.pexels.com/photos/5412373/pexels-photo-5412373.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "description": "Imagen abstracta educativa para estados vacíos (usar muy sutil, opacidad baja, nunca detrás de texto largo).",
        "category": "empty-states"
      }
    ]
  },

  "instructions_to_main_agent": {
    "critical": [
      "UI 100% en español (labels, botones, toasts, estados, placeholders).",
      "No usar estilos centrados globales tipo .App { text-align:center }.",
      "Eliminar/ignorar estilos default de CRA en App.css (header negro, logo animado).",
      "Actualizar /app/frontend/src/index.css tokens HSL según brand_tokens.color_system.shadcn_hsl_tokens_to_set_in_index_css.",
      "Añadir imports de Google Fonts (Space Grotesk + Work Sans + Roboto Mono) en index.html o CSS.",
      "Usar shadcn/ui para TODOS los componentes (Select, Dialog, Drawer, Calendar, DropdownMenu, Tabs, Table, etc.).",
      "Todas las acciones async: skeleton + disabled + toast (sonner).",
      "Confirmación de borrado: AlertDialog.",
      "Role-based UI: ocultar acciones SUPERUSER a ADMIN (no solo deshabilitar).",
      "Añadir data-testid a: navegación, botones, inputs, tablas, badges de estado, mensajes de error, diálogos de confirmación.",
      "Archivos son .js/.jsx (no .tsx): escribir ejemplos y componentes en JS."
    ],
    "suggested_structure": [
      "Layout: components/layout/SidebarLayout.jsx (Sidebar + Topbar + Outlet)",
      "Pages: pages/* (DashboardPage.jsx, ClasesPage.jsx, ClaseDetailPage.jsx, etc.)",
      "Shared: components/common/* (PageHeader.jsx, FiltersBar.jsx, DataTable.jsx wrapper, EmptyState.jsx)"
    ],
    "tailwind_notes": [
      "Usar bg-background en body; cards bg-card.",
      "Aplicar noise overlay solo en hero/login panel (<=20% viewport).",
      "Evitar gradientes saturados y grandes; si se usa, solo decorativo."
    ]
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
