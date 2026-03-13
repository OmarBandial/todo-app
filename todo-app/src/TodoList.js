import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

const GET_TODOS = gql`
query GetTodos {
getTodos { id name description completed }
}`;

const ADD_TODO = gql`
mutation AddTodo($name: String!, $description: String) {
addTodo(name: $name, description: $description) {
id name description completed
}}`;

const TOGGLE_TODO = gql`
mutation ToggleTodo($id: ID!) {
toggleTodo(id: $id) { id completed }
}`;

function TodoList() {
    const { loading, error, data } = useQuery(GET_TODOS);
    const [addTodo] = useMutation(ADD_TODO,
        { refetchQueries: [{ query: GET_TODOS }] });
    const [toggleTodo] = useMutation(TOGGLE_TODO);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleAddTodo = (e) => {
        e.preventDefault();
        addTodo({ variables: { name, description } });
        setName('');
        setDescription('');
    };

    if (loading) return <p>Loading...</p>;
    if (error) {
        console.error("GraphQL Error:", error);
        return <p>Error :( {error.message}</p>;
    }

    return (
        <div>
            <form onSubmit={handleAddTodo}>
                <input 
                    placeholder="Name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                />
                <input 
                    placeholder="Description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                />
                <button type="submit">Add Todo</button>
            </form>
            <ul>
                {data.getTodos && data.getTodos.map(({ id, name, description, completed }) => (
                    <li key={id}>
                        <span 
                            style={{ textDecoration: completed ? 'line-through' : 'none', cursor: 'pointer' }}
                            onClick={() => toggleTodo({ variables: { id } })}
                        >
                            {name}: {description}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TodoList;