import React, { useState, useRef, useEffect } from 'react';
import OpenAI from "openai"; 
import { useData } from '@/contexts/DataContext';
import { X, Send, User, Zap, AlertCircle, CheckCircle, Trash2, CheckSquare } from 'lucide-react'; 
import ReactMarkdown from 'react-markdown';
import vakaImage from '@/assets/vaka.png'; 

// --- CONFIGURACIÓN GROQ ---
const openai = new OpenAI({
  apiKey: "", 
  baseURL: "https://api.groq.com/openai/v1", 
  dangerouslyAllowBrowser: true
});

const FrenchieIcon = ({ className }: { className?: string }) => (
  <img 
    src={vakaImage} 
    alt="Vaka AI" 
    className={`object-contain drop-shadow-md hover:scale-105 transition-transform duration-300 ${className}`} 
  />
);

export const AIAssistant = () => {
  const context = useData();
  
  // Extracción segura de datos
  const accounts = context?.accounts || [];
  const transactions = context?.transactions || [];
  const goals = context?.goals || [];
  const tasks = context?.tasks || []; 

  // --- EJECUTOR SEGURO (ANTI-CRASH) ---
  const executeAction = (actionName: string, payload: any) => {
    if (!context) return "⚠️ Error: No hay conexión con la base de datos.";

    console.log(`🤖 Intentando acción: ${actionName}`, payload);

    try {
      switch (actionName) {
        // --- TAREAS (Aquí estaba el problema) ---
        case 'add_task':
          // 1. Verificamos si la función existe REALMENTE
          if (typeof context.addTask !== 'function') {
             return "⚠️ Tu App no tiene la función 'addTask' programada en DataContext. No puedo crear la tarea.";
          }
          
          // 2. Rellenamos datos faltantes para evitar crashes
          const newTask = {
            id: crypto.randomUUID(), // Generamos ID si falta
            title: payload.title || "Nueva Tarea",
            description: payload.description || "",
            dueDate: payload.dueDate || new Date().toISOString(),
            completed: false,
            ...payload // Sobreescribimos con lo que mandó la IA
          };

          context.addTask(newTask);
          return `📝 Tarea creada: ${newTask.title}`;

        case 'delete_task':
          if (typeof context.deleteTask !== 'function') return "⚠️ Función 'deleteTask' no encontrada.";
          context.deleteTask(payload.id);
          return "🗑️ Tarea eliminada.";

        // --- CUENTAS ---
        case 'create_account':
          if (typeof context.addAccount !== 'function') return "⚠️ Función 'addAccount' no encontrada.";
          context.addAccount({ ...payload, balance: Number(payload.balance) });
          return `✅ Cuenta creada: ${payload.name}`;
        
        case 'delete_account':
          if (typeof context.deleteAccount !== 'function') return "⚠️ Función 'deleteAccount' no encontrada.";
          context.deleteAccount(payload.id);
          return `🗑️ Cuenta eliminada.`;

        // --- TRANSACCIONES ---
        case 'add_transaction':
          if (typeof context.addTransaction !== 'function') return "⚠️ Función 'addTransaction' no encontrada.";
          const accId = payload.accountId || accounts[0]?.id;
          if (!accId) return "⚠️ Error: No tienes cuentas creadas para asignar este gasto.";
          
          context.addTransaction({
              ...payload,
              amount: Number(payload.amount),
              date: new Date().toISOString(),
              accountId: accId
          });
          return `💸 Transacción registrada: ${payload.description}`;

        // --- METAS ---
        case 'add_goal':
          if (typeof context.addGoal !== 'function') return "⚠️ Función 'addGoal' no encontrada.";
          context.addGoal({
              ...payload,
              currentAmount: 0,
              targetAmount: Number(payload.targetAmount),
              deadline: payload.deadline || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString()
          });
          return `🎯 Meta establecida: ${payload.name}`;

        case 'delete_goal':
           if (typeof context.deleteGoal !== 'function') return "⚠️ Función 'deleteGoal' no encontrada.";
           context.deleteGoal(payload.id);
           return `🗑️ Meta eliminada.`;

        default:
          return `⚠️ No sé cómo ejecutar la acción: ${actionName}`;
      }
    } catch (err: any) {
      console.error("CRASH EVITADO:", err);
      return `🔴 Error crítico al ejecutar: ${err.message}`;
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, isError?: boolean, isAction?: boolean}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isProcessingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  // --- CONTEXTO ---
  const getFullContext = () => {
    // Usamos ?. para evitar errores si algo es undefined
    const accountList = accounts?.map((a: any) => `ID: "${a.id}", Nombre: "${a.name}", Saldo: $${a.balance}`).join("\n") || "";
    const goalList = goals?.map((g: any) => `ID: "${g.id}", Meta: "${g.name}"`).join("\n") || "";
    // Solo mostramos tareas si existen
    const taskList = tasks?.length > 0 ? tasks.map((t: any) => `ID: "${t.id}", Tarea: "${t.title}"`).join("\n") : "No hay tareas.";
    
    return `
      DATOS:
      [CUENTAS]: ${accountList}
      [METAS]: ${goalList}
      [TAREAS]: ${taskList}
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const dataContext = getFullContext();

      const systemPrompt = `
        Eres Vaka, un Super Admin AI para una App de Finanzas.
        Controlas la base de datos.
        
        CONTEXTO:
        ${dataContext}

        INSTRUCCIONES:
        - Si piden ACCIÓN -> Responde SOLO JSON.
        - Si piden CONSEJO -> Responde TEXTO.

        ACCIONES JSON:
        - Tarea: {"action": "add_task", "payload": {"title": "Nombre", "description": "Detalle"}}
        - Borrar Tarea: {"action": "delete_task", "payload": {"id": "ID_EXACTO"}}
        
        - Cuenta: {"action": "create_account", "payload": {"name": "Nombre", "type": "bank", "balance": 0, "currency": "$"}}
        - Borrar Cuenta: {"action": "delete_account", "payload": {"id": "ID_EXACTO"}}
        
        - Gasto: {"action": "add_transaction", "payload": {"amount": 100, "description": "Detalle", "type": "withdrawal", "category": "General"}}
        
        - Meta: {"action": "add_goal", "payload": {"name": "Nombre", "targetAmount": 100}}
        - Borrar Meta: {"action": "delete_goal", "payload": {"id": "ID_EXACTO"}}
      `;

      const completion = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content || "";
      let replyText = responseText;
      let isAction = false;
      let isError = false;

      try {
        if (responseText.trim().startsWith('{')) {
           const command = JSON.parse(responseText);
           if (command.action && command.payload) {
               replyText = executeAction(command.action, command.payload);
               // Si el resultado empieza con ⚠️ o 🔴, es error, no acción exitosa
               if (replyText.startsWith('⚠️') || replyText.startsWith('🔴')) {
                   isError = true;
               } else {
                   isAction = true;
               }
           } else if (command.message) {
               replyText = command.message;
           }
        }
      } catch (err: any) {
        console.error("Error parseo:", err);
        if (responseText.trim().startsWith('{')) {
            replyText = `❌ Error procesando orden: ${err.message}`;
            isError = true;
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: replyText, isAction, isError }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ Error: ${error.message}`, isError: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => { isProcessingRef.current = false; }, 1000);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-[100] transition-all duration-300 hover:scale-110 active:scale-95 group"
      >
        <div className={`
            ${isOpen ? 'bg-blue-600 text-white' : 'bg-white'} 
            backdrop-blur-xl p-3 rounded-[2rem] h-20 w-20 flex items-center justify-center 
            shadow-[0_8px_40px_rgba(37,99,235,0.25)] border-2 ${isOpen ? 'border-blue-500' : 'border-white/50'} transition-all
        `}>
            {isOpen ? <X className="w-10 h-10" /> : <FrenchieIcon className="w-16 h-16" />}
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[90] bg-gray-900/40 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-[90vh] flex flex-col relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border border-white/60 overflow-hidden ring-1 ring-white/40 animate-in zoom-in-95 duration-300">
            
            <div className="absolute top-0 left-0 right-0 h-24 bg-white/50 backdrop-blur-md flex items-center justify-center border-b border-blue-100/50 z-10">
                <div className="flex items-center gap-4">
                    <FrenchieIcon className="w-12 h-12" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-none">Vaka AI</h2>
                        <span className="text-sm font-semibold text-blue-600 tracking-wide flex items-center gap-1">
                            <Zap size={14} fill="currentColor" /> Control Total
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pt-32 space-y-8 pb-36 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20 flex flex-col items-center animate-pulse space-y-6">
                        <FrenchieIcon className="w-48 h-48 drop-shadow-2xl" />
                        <div className="bg-white/70 px-8 py-4 rounded-[2rem] border border-white shadow-sm">
                            <p className="text-3xl font-bold text-gray-800 tracking-tight">¡Hola Jefe!</p>
                        </div>
                        <p className="text-lg font-medium text-gray-500">¿Qué gestionamos hoy? 🏗️</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-6 duration-500`}>
                        {msg.role === 'user' ? (
                           <div className="flex items-end gap-4 max-w-[85%]">
                               <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 shadow-sm border border-gray-50"><User size={22} /></div>
                               <div className="bg-gray-100 text-gray-900 px-7 py-5 rounded-[2.5rem] rounded-bl-none shadow-sm border border-gray-50"><p className="text-lg font-medium">{msg.text}</p></div>
                           </div>
                        ) : (
                           <div className="flex items-end gap-4 max-w-[85%] justify-end">
                               <div className={`
                                   ${msg.isError ? 'bg-red-50 text-red-600 border border-red-100' : 
                                     msg.isAction ? 'bg-green-600 text-white shadow-[0_10px_30px_-10px_rgba(22,163,74,0.5)]' : 
                                     'bg-blue-600 text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)]'} 
                                   px-7 py-5 rounded-[2.5rem] rounded-br-none
                               `}>
                                   {msg.isAction && <div className="flex items-center gap-2 mb-2 font-bold"><CheckSquare size={20} /> Hecho</div>}
                                   {msg.isError ? (
                                       <div className="flex items-center gap-2 font-medium text-lg"><AlertCircle size={24} /><p>{msg.text}</p></div>
                                   ) : (
                                       <div className="text-lg leading-relaxed prose-invert font-normal"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                                   )}
                               </div>
                               <div className="w-10 h-10 flex-shrink-0 shadow-md rounded-full bg-white p-1"><FrenchieIcon className="w-full h-full" /></div>
                           </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-center my-6">
                        <div className="bg-white/80 backdrop-blur text-blue-600 px-6 py-3 rounded-full shadow-lg border border-blue-100 flex items-center gap-3">
                            <FrenchieIcon className="w-6 h-6 animate-bounce" />
                            <span className="font-bold text-sm tracking-wide">Trabajando...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-sm pb-8">
                <div className="relative flex items-center bg-white rounded-[3rem] p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/30">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ordena: Crear, Borrar, Tareas..."
                        className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 px-8 py-5 outline-none text-xl font-medium"
                        autoFocus
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-full shadow-lg w-16 h-16 flex items-center justify-center">
                        <Send size={28} />
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};