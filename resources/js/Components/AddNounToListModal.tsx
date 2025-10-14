import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiPlus } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface NounList {
  id: number;
  name: string;
  description: string | null;
  contains_noun: boolean;
}

interface Props {
  nounId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddNounToListModal({ nounId, isOpen, onClose }: Props) {
  const { t: trans } = useTranslation();
  const [lists, setLists] = useState<NounList[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLists();
    }
  }, [isOpen, nounId]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const response = await fetch(route('api.nouns.lists', nounId));
      const data = await response.json();
      setLists(data.data || []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleList = async (listId: number, currentlyContains: boolean) => {
    setProcessing(true);
    
    if (currentlyContains) {
      // Remove from list
      router.delete(route('noun-lists.remove-noun', [listId, nounId]), {
        preserveScroll: true,
        onSuccess: () => {
          // Update local state
          setLists(lists.map(list => 
            list.id === listId ? { ...list, contains_noun: false } : list
          ));
        },
        onFinish: () => setProcessing(false),
      });
    } else {
      // Add to list
      router.post(
        route('noun-lists.add-noun', listId),
        { noun_id: nounId },
        {
          preserveScroll: true,
          onSuccess: () => {
            // Update local state
            setLists(lists.map(list => 
              list.id === listId ? { ...list, contains_noun: true } : list
            ));
          },
          onFinish: () => setProcessing(false),
        }
      );
    }
  };

  const handleCreateNewList = () => {
    onClose();
    router.visit(route('noun-lists.create'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">{trans('Add to List')}</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {trans('Select which lists to add this noun to.')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {trans('Loading lists...')}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {trans('You don\'t have any lists yet.')}
              </p>
              <Button onClick={handleCreateNewList}>
                <FiPlus className="mr-2" />
                {trans('Create Your First List')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lists.map((list) => (
                <div key={list.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`list-${list.id}`}
                    checked={list.contains_noun}
                    onCheckedChange={() => handleToggleList(list.id, list.contains_noun)}
                    disabled={processing}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`list-${list.id}`}
                      className="font-medium cursor-pointer text-gray-900 dark:text-gray-100"
                    >
                      {list.name}
                    </Label>
                    {list.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {list.description}
                      </p>
                    )}
                  </div>
                  {list.contains_noun && (
                    <FiCheck className="text-green-600 dark:text-green-400" />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCreateNewList}
                >
                  <FiPlus className="mr-2" />
                  {trans('Create New List')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
